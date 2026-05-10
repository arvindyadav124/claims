"""
Centralized claim / claim-line-item state rules (int enums + explicit transitions).

Suggested transition maps (implemented in CLAIM_TRANSITIONS / LINE_ITEM_TRANSITIONS):

Claim (workflow):
    DRAFT → SUBMITTED → IN_REVIEW → PARTIALLY_APPROVED ─┬→ APPROVED → PAID → (end)
                              │                         ├→ APPROVED ────────┘
                              └─────────────────────────┴→ DENIED → (end)

    PARTIALLY_APPROVED → APPROVED or DENIED (no direct PAID; PAID only from APPROVED).

Line item (adjudication):
    PENDING → APPROVED or DENIED or MANUAL_REVIEW
    MANUAL_REVIEW → APPROVED or DENIED
    APPROVED / DENIED → (end)

Design notes (take-home scope):
- Line-item transitions still use LINE_ITEM_TRANSITIONS only; claim header transitions still use
  CLAIM_TRANSITIONS only (no free-form status writes).
- When *every* line item is terminal (APPROVED or DENIED), services may advance the parent claim to
  match the aggregate (all approved → APPROVED, all denied → DENIED, mixed → PARTIALLY_APPROVED),
  using valid claim transitions (including SUBMITTED → IN_REVIEW when a hop is required).
- Line-item transitions are blocked once the parent claim is PAID.
- Same-state transitions are treated as no-ops (idempotent).
"""
from __future__ import annotations

from enum import IntEnum
from typing import FrozenSet, Mapping

from django.core.exceptions import ValidationError


class ClaimState(IntEnum):
    DRAFT = 1
    SUBMITTED = 2
    IN_REVIEW = 3
    PARTIALLY_APPROVED = 4
    APPROVED = 5
    DENIED = 6
    PAID = 7


class ClaimLineItemState(IntEnum):
    PENDING = 1
    APPROVED = 2
    DENIED = 3
    MANUAL_REVIEW = 4


# --- Transition maps (single source of truth) ---------------------------------

CLAIM_TRANSITIONS: Mapping[ClaimState, FrozenSet[ClaimState]] = {
    ClaimState.DRAFT: frozenset({ClaimState.SUBMITTED}),
    ClaimState.SUBMITTED: frozenset({ClaimState.IN_REVIEW}),
    ClaimState.IN_REVIEW: frozenset(
        {
            ClaimState.PARTIALLY_APPROVED,
            ClaimState.APPROVED,
            ClaimState.DENIED,
        }
    ),
    ClaimState.PARTIALLY_APPROVED: frozenset({ClaimState.APPROVED, ClaimState.DENIED}),
    ClaimState.APPROVED: frozenset({ClaimState.PAID}),
    ClaimState.DENIED: frozenset(),
    ClaimState.PAID: frozenset(),
}

LINE_ITEM_TRANSITIONS: Mapping[ClaimLineItemState, FrozenSet[ClaimLineItemState]] = {
    ClaimLineItemState.PENDING: frozenset(
        {
            ClaimLineItemState.APPROVED,
            ClaimLineItemState.DENIED,
            ClaimLineItemState.MANUAL_REVIEW,
        }
    ),
    ClaimLineItemState.MANUAL_REVIEW: frozenset(
        {
            ClaimLineItemState.APPROVED,
            ClaimLineItemState.DENIED,
        }
    ),
    ClaimLineItemState.APPROVED: frozenset(),
    ClaimLineItemState.DENIED: frozenset(),
}


def claim_state_label(state: ClaimState) -> str:
    return state.name.replace("_", " ").title()


def line_item_state_label(state: ClaimLineItemState) -> str:
    return state.name.replace("_", " ").title()


def claim_allowed_targets(from_state: ClaimState) -> FrozenSet[ClaimState]:
    return CLAIM_TRANSITIONS.get(from_state, frozenset())


def line_item_allowed_targets(from_state: ClaimLineItemState) -> FrozenSet[ClaimLineItemState]:
    return LINE_ITEM_TRANSITIONS.get(from_state, frozenset())


def coerce_claim_state(value: int, *, field: str = "status") -> ClaimState:
    try:
        return ClaimState(int(value))
    except ValueError:
        valid = ", ".join(str(s.value) for s in ClaimState)
        raise ValidationError({field: [f"Unknown claim status code {value!r}. Valid codes: {valid}."]}) from None


def coerce_line_item_state(value: int, *, field: str = "status") -> ClaimLineItemState:
    try:
        return ClaimLineItemState(int(value))
    except ValueError:
        valid = ", ".join(str(s.value) for s in ClaimLineItemState)
        raise ValidationError({field: [f"Unknown line-item status code {value!r}. Valid codes: {valid}."]}) from None


def validate_claim_transition(from_state: ClaimState, to_state: ClaimState) -> None:
    if from_state == to_state:
        return
    allowed = claim_allowed_targets(from_state)
    if to_state not in allowed:
        allowed_txt = (
            ", ".join(f"{s.value} ({claim_state_label(s)})" for s in sorted(allowed, key=lambda x: x.value))
            or "none (terminal state)"
        )
        raise ValidationError(
            {
                "status": [
                    (
                        f"Invalid claim transition {claim_state_label(from_state)} → {claim_state_label(to_state)}. "
                        f"Allowed next states: {allowed_txt}."
                    )
                ]
            }
        )


def validate_line_item_transition(from_state: ClaimLineItemState, to_state: ClaimLineItemState) -> None:
    if from_state == to_state:
        return
    allowed = line_item_allowed_targets(from_state)
    if to_state not in allowed:
        allowed_txt = (
            ", ".join(f"{s.value} ({line_item_state_label(s)})" for s in sorted(allowed, key=lambda x: x.value))
            or "none (terminal state)"
        )
        raise ValidationError(
            {
                "status": [
                    (
                        f"Invalid line-item transition {line_item_state_label(from_state)} → "
                        f"{line_item_state_label(to_state)}. Allowed next states: {allowed_txt}."
                    )
                ]
            }
        )


def assert_line_item_mutable_for_parent_claim(*, claim_status: int) -> None:
    """Block line-item edits after financial close on the header claim."""
    paid = ClaimState.PAID.value
    if int(claim_status) == paid:
        raise ValidationError(
            {"claim": ["This claim is PAID; line-item status can no longer be changed."]}
        )
