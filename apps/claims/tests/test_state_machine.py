from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.claims import services
from apps.claims.models import ClaimLineItem
from apps.claims.state_machine import ClaimLineItemState, ClaimState
from apps.members import services as member_services
from apps.policies import services as policy_services
from apps.policies.models import Policy


@pytest.mark.django_db
def test_claim_happy_path_through_paid():
    member_services.member_create(first_name="A", last_name="B", email="sm@example.com")
    p = policy_services.policy_create(
        name="Plan",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SM1", amount_cents=100)
    assert c.status == ClaimState.DRAFT.value
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.SUBMITTED.value)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.IN_REVIEW.value)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.APPROVED.value)
    c = services.claim_transition(claim_id=c.pk, to_status=ClaimState.PAID.value)
    assert c.status == ClaimState.PAID.value


@pytest.mark.django_db
def test_claim_cannot_skip_to_paid():
    member_services.member_create(first_name="A", last_name="B", email="sm2@example.com")
    p = policy_services.policy_create(
        name="Plan2",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SM2", amount_cents=100)
    with pytest.raises(ValidationError):
        services.claim_transition(claim_id=c.pk, to_status=ClaimState.PAID.value)


@pytest.mark.django_db
def test_line_item_manual_review_branch():
    member_services.member_create(first_name="A", last_name="B", email="sm3@example.com")
    p = policy_services.policy_create(
        name="Plan3",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SM3", amount_cents=100)
    li = services.claim_line_item_create(claim=c, diagnosis_code="D1", amount=Decimal("10.00"))
    assert li.status == ClaimLineItemState.PENDING.value
    li = services.claim_line_item_transition(line_item_id=li.pk, to_status=ClaimLineItemState.MANUAL_REVIEW.value)
    li = services.claim_line_item_transition(line_item_id=li.pk, to_status=ClaimLineItemState.APPROVED.value)
    assert li.status == ClaimLineItemState.APPROVED.value


@pytest.mark.django_db
def test_line_item_frozen_when_claim_paid():
    member_services.member_create(first_name="A", last_name="B", email="sm4@example.com")
    p = policy_services.policy_create(
        name="Plan4",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SM4", amount_cents=100)
    li = services.claim_line_item_create(claim=c, diagnosis_code="D2", amount=Decimal("5.00"))
    for s in (
        ClaimState.SUBMITTED,
        ClaimState.IN_REVIEW,
        ClaimState.APPROVED,
        ClaimState.PAID,
    ):
        c = services.claim_transition(claim_id=c.pk, to_status=s.value)
    with pytest.raises(ValidationError):
        services.claim_line_item_transition(line_item_id=li.pk, to_status=ClaimLineItemState.DENIED.value)


@pytest.mark.django_db
def test_claim_transition_api_returns_400_on_invalid():
    member_services.member_create(first_name="A", last_name="B", email="sm5@example.com")
    p = policy_services.policy_create(
        name="Plan5",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-SM5", amount_cents=100)
    client = APIClient()
    url = reverse("claim-transition", kwargs={"pk": c.pk})
    r = client.post(url, {"status": ClaimState.PAID.value}, format="json")
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert "status" in r.data
