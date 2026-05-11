from decimal import Decimal

import pytest

from apps.claims import services
from apps.claims.state_machine import ClaimLineItemState, ClaimState
from apps.policies import services as policy_services
from apps.policies.models import Policy


@pytest.mark.django_db
def test_all_lines_approved_moves_claim_to_approved_when_in_review():
    p = policy_services.policy_create(
        name="P1",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SYNC1", amount_cents=100)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.SUBMITTED.value)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.IN_REVIEW.value)
    li1 = services.claim_line_item_create(claim=c, diagnosis_code="A", amount=Decimal("1.00"))
    li2 = services.claim_line_item_create(claim=c, diagnosis_code="B", amount=Decimal("2.00"))
    services.claim_line_item_transition(line_item_id=li1.pk, to_status=ClaimLineItemState.APPROVED.value)
    c.refresh_from_db()
    assert c.status == ClaimState.IN_REVIEW.value
    services.claim_line_item_transition(line_item_id=li2.pk, to_status=ClaimLineItemState.APPROVED.value)
    c.refresh_from_db()
    assert c.status == ClaimState.APPROVED.value


@pytest.mark.django_db
def test_mixed_line_outcomes_set_claim_partially_approved():
    p = policy_services.policy_create(
        name="P2",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SYNC2", amount_cents=100)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.SUBMITTED.value)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.IN_REVIEW.value)
    li1 = services.claim_line_item_create(claim=c, diagnosis_code="A", amount=Decimal("1.00"))
    li2 = services.claim_line_item_create(claim=c, diagnosis_code="B", amount=Decimal("2.00"))
    services.claim_line_item_transition(line_item_id=li1.pk, to_status=ClaimLineItemState.APPROVED.value)
    services.claim_line_item_transition(line_item_id=li2.pk, to_status=ClaimLineItemState.DENIED.value)
    c.refresh_from_db()
    assert c.status == ClaimState.PARTIALLY_APPROVED.value


@pytest.mark.django_db
def test_all_lines_denied_sets_claim_denied_from_submitted_chain():
    p = policy_services.policy_create(
        name="P3",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SYNC3", amount_cents=100)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.SUBMITTED.value)
    li = services.claim_line_item_create(claim=c, diagnosis_code="X", amount=Decimal("1.00"))
    services.claim_line_item_transition(line_item_id=li.pk, to_status=ClaimLineItemState.DENIED.value)
    c.refresh_from_db()
    assert c.status == ClaimState.DENIED.value
