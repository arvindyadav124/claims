from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Prefetch, QuerySet
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.claims.models import Claim, ClaimLineItem, Dispute
from apps.claims.state_machine import (
    ClaimLineItemState,
    ClaimState,
    DisputeState,
    assert_line_item_mutable_for_parent_claim,
    coerce_claim_state,
    coerce_dispute_state,
    coerce_line_item_state,
    validate_claim_transition,
    validate_dispute_transition,
    validate_line_item_transition,
)
from apps.policies.models import Policy


def _claim_queryset_with_line_items() -> QuerySet[Claim]:
    line_qs = ClaimLineItem.objects.select_related("checked_by").order_by("id")
    return Claim.objects.select_related("policy", "checked_by").prefetch_related(
        Prefetch("line_items", queryset=line_qs)
    )


def _raise_drf(dj_exc: DjangoValidationError) -> None:
    raise DRFValidationError(detail=dj_exc.error_dict)


def _sync_claim_with_line_item_outcomes(*, claim_id: int, actor_id: int | None = None) -> None:
    """
    When every line item is adjudicated (APPROVED or DENIED), align the claim header if allowed.

    Skips DRAFT and terminal header states (APPROVED, PAID, DENIED) so we do not reopen or bypass
    payment / denial outcomes.
    """
    claim = Claim.objects.select_for_update().get(pk=claim_id)
    if claim.status in (
        ClaimState.DRAFT.value,
        ClaimState.APPROVED.value,
        ClaimState.PAID.value,
        ClaimState.DENIED.value,
    ):
        return

    lines = list(ClaimLineItem.objects.filter(claim_id=claim_id))
    if not lines:
        return

    ap = ClaimLineItemState.APPROVED.value
    dn = ClaimLineItemState.DENIED.value
    if any(int(li.status) not in (ap, dn) for li in lines):
        return

    if all(int(li.status) == ap for li in lines):
        desired = ClaimState.APPROVED
    elif all(int(li.status) == dn for li in lines):
        desired = ClaimState.DENIED
    else:
        desired = ClaimState.PARTIALLY_APPROVED

    claim.refresh_from_db(fields=["status"])
    if ClaimState(claim.status) == desired:
        return

    if ClaimState(claim.status) == ClaimState.SUBMITTED:
        claim_transition(claim_id=claim_id, to_status=ClaimState.IN_REVIEW.value, updated_by_id=actor_id)

    claim.refresh_from_db(fields=["status"])
    if ClaimState(claim.status) != desired:
        claim_transition(claim_id=claim_id, to_status=desired.value, updated_by_id=actor_id)


def claim_submit(
    *,
    policy: Policy,
    claim_number: str,
    amount_cents: int,
    created_by=None,
    updated_by=None,
) -> Claim:
    c = Claim.objects.create(
        policy=policy,
        claim_number=claim_number,
        amount_cents=amount_cents,
        status=ClaimState.DRAFT.value,
        created_by=created_by,
        updated_by=updated_by,
    )
    return _claim_queryset_with_line_items().get(pk=c.pk)


def claim_get(pk: int) -> Claim:
    return _claim_queryset_with_line_items().get(pk=pk)


def claims_for_policy(*, policy_id: int) -> QuerySet[Claim]:
    return _claim_queryset_with_line_items().filter(policy_id=policy_id).order_by("-created_at")


def claim_list() -> QuerySet[Claim]:
    return _claim_queryset_with_line_items().order_by("claim_number")


@transaction.atomic
def claim_transition(
    *,
    claim_id: int,
    to_status: int,
    checked_by_id: int | None = None,
    updated_by_id: int | None = None,
) -> Claim:
    claim = Claim.objects.select_for_update().get(pk=claim_id)
    current = coerce_claim_state(claim.status)
    target = coerce_claim_state(to_status)
    try:
        validate_claim_transition(current, target)
    except DjangoValidationError as exc:
        _raise_drf(exc)
    claim.status = target.value
    if checked_by_id is not None:
        claim.checked_by_id = checked_by_id
    if updated_by_id is not None:
        claim.updated_by_id = updated_by_id
    claim.save()
    return _claim_queryset_with_line_items().get(pk=claim.pk)


def claim_line_item_create(**kwargs) -> ClaimLineItem:
    kwargs.pop("status", None)
    kwargs["status"] = ClaimLineItemState.PENDING.value
    return ClaimLineItem.objects.create(**kwargs)


def claim_line_item_get(pk: int) -> ClaimLineItem:
    return ClaimLineItem.objects.select_related("claim", "checked_by").get(pk=pk)


def claim_line_items_for_claim(*, claim_id: int) -> QuerySet[ClaimLineItem]:
    return ClaimLineItem.objects.filter(claim_id=claim_id).select_related("claim", "checked_by").order_by("id")


@transaction.atomic
def claim_line_item_transition(
    *,
    line_item_id: int,
    to_status: int,
    checked_by_id: int | None = None,
    actor_id: int | None = None,
) -> ClaimLineItem:
    item = ClaimLineItem.objects.select_related("claim").select_for_update().get(pk=line_item_id)
    try:
        assert_line_item_mutable_for_parent_claim(claim_status=item.claim.status)
    except DjangoValidationError as exc:
        _raise_drf(exc)
    current = coerce_line_item_state(item.status)
    target = coerce_line_item_state(to_status)
    try:
        validate_line_item_transition(current, target)
    except DjangoValidationError as exc:
        _raise_drf(exc)
    item.status = target.value
    if checked_by_id is not None:
        item.checked_by_id = checked_by_id
    item.save(update_fields=["status", "checked_by"])
    _sync_claim_with_line_item_outcomes(claim_id=item.claim_id, actor_id=actor_id)
    item.refresh_from_db()
    return item


def dispute_create(**kwargs) -> Dispute:
    kwargs.pop("status", None)
    kwargs["status"] = DisputeState.DRAFT.value
    return Dispute.objects.create(**kwargs)


@transaction.atomic
def dispute_transition(
    *,
    dispute_id: int,
    to_status: int,
    checked_by_id: int | None = None,
    updated_by_id: int | None = None,
) -> Dispute:
    dispute = Dispute.objects.select_for_update().get(pk=dispute_id)
    current = coerce_dispute_state(dispute.status)
    target = coerce_dispute_state(to_status)
    try:
        validate_dispute_transition(current, target)
    except DjangoValidationError as exc:
        _raise_drf(exc)
    dispute.status = target.value
    if checked_by_id is not None:
        dispute.checked_by_id = checked_by_id
    if updated_by_id is not None:
        dispute.updated_by_id = updated_by_id
    dispute.save()
    return dispute


def dispute_get(pk: int) -> Dispute:
    return Dispute.objects.select_related("claim", "checked_by", "created_by", "updated_by").get(pk=pk)


def disputes_for_claim(*, claim_id: int) -> QuerySet[Dispute]:
    return (
        Dispute.objects.filter(claim_id=claim_id)
        .select_related("claim", "checked_by", "created_by", "updated_by")
        .order_by("-created_at")
    )
