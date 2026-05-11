from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.claims import services
from apps.claims.auto_review import collect_auto_approval_violations
from apps.claims.models import Claim, ClaimLineItem
from apps.claims.state_machine import ClaimState
from apps.member_policies import services as mp_services
from apps.members import services as member_services
from apps.members.models import Member
from apps.policies import services as policy_services
from apps.policies.models import Policy

User = get_user_model()


def _base_setup(*, gender=Member.Gender.M, policy_gender=Policy.EligibleGender.BOTH, min_age=18, max_age=99):
    user = User.objects.create_user(email="auto-review@test.example", password="Xx9!long-pass-word")
    today = timezone.now().date()
    member = member_services.member_create(
        first_name="Test",
        last_name="Member",
        email="auto-review@test.example",
        user=user,
        dob=today - timedelta(days=365 * 35),
        gender=gender,
        mobile="5550000",
    )
    policy = policy_services.policy_create(
        name="AutoReview Policy",
        price=Decimal("100.00"),
        min_age=min_age,
        max_age=max_age,
        eligible_gender=policy_gender,
        total_cover=1_000_000,
        created_by=user,
        updated_by=user,
    )
    policy_services.policy_item_create(
        policy=policy,
        diagnosis_code="A01",
        max_percent_of_policy=50,
        max_yearly_limit=Decimal("50000.00"),
        max_claims_per_year=3,
        created_by=user,
        updated_by=user,
    )
    mp_services.member_policy_create(
        member=member,
        policy=policy,
        purchasing_date=today - timedelta(days=30),
        price=Decimal("10.00"),
        valid_up_to=today + timedelta(days=365),
        created_by=user,
        updated_by=user,
    )
    claim = services.claim_submit(
        policy=policy,
        claim_number="CLM-AUTO-1",
        amount_cents=100,
        created_by=user,
        updated_by=user,
    )
    services.claim_line_item_create(
        claim=claim,
        diagnosis_code="A01",
        amount=Decimal("1000.00"),
    )
    claim = services.claim_get(pk=claim.pk)
    return user, policy, claim


@pytest.mark.django_db
def test_auto_review_passes_and_submits():
    user, _policy, claim = _base_setup()
    c = services.claim_get(pk=claim.pk)
    assert collect_auto_approval_violations(claim=c, user=user) == []

    out = services.claim_submit_for_auto_approval(claim_id=claim.pk, user=user)
    assert out.status == ClaimState.SUBMITTED.value


@pytest.mark.django_db
def test_auto_review_fails_age():
    user, _policy, claim = _base_setup(min_age=60, max_age=99)
    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("age" in m.lower() for m in v)


@pytest.mark.django_db
def test_auto_review_fails_gender():
    user, _policy, claim = _base_setup(gender=Member.Gender.M, policy_gender=Policy.EligibleGender.FEMALE)
    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("gender" in m.lower() for m in v)


@pytest.mark.django_db
def test_auto_review_fails_unknown_diagnosis():
    user, _policy, claim = _base_setup()
    services.claim_line_item_create(claim=claim, diagnosis_code="ZZ99", amount=Decimal("1.00"))
    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("ZZ99" in m or "not covered" in m for m in v)


@pytest.mark.django_db
def test_auto_review_fails_yearly_limit():
    user, _policy, claim = _base_setup()
    ClaimLineItem.objects.filter(claim_id=claim.pk).update(amount=Decimal("999999.00"))
    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("exceeds" in m.lower() for m in v)


@pytest.mark.django_db
def test_auto_review_fails_percent_of_cover():
    user, _policy, claim = _base_setup()
    ClaimLineItem.objects.filter(claim_id=claim.pk).update(amount=Decimal("600000.00"))
    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("%" in m or "percent" in m.lower() for m in v)


@pytest.mark.django_db
def test_auto_review_fails_max_claims_per_year():
    user, policy, claim = _base_setup()
    for i in range(3):
        other = services.claim_submit(
            policy=policy,
            claim_number=f"CLM-PREV-{i}",
            amount_cents=1,
            created_by=user,
            updated_by=user,
        )
        services.claim_line_item_create(
            claim=other,
            diagnosis_code="A01",
            amount=Decimal("10.00"),
        )
        Claim.objects.filter(pk=other.pk).update(status=ClaimState.APPROVED.value, created_at=timezone.now())

    c = services.claim_get(pk=claim.pk)
    v = collect_auto_approval_violations(claim=c, user=user)
    assert any("Maximum approved" in m for m in v)


@pytest.mark.django_db
def test_submit_for_auto_approval_api():
    user, _policy, claim = _base_setup()
    client = APIClient()
    client.force_authenticate(user=user)
    url = reverse("claim-submit-for-auto-approval", kwargs={"pk": claim.pk})
    r = client.post(url, {}, format="json")
    assert r.status_code == status.HTTP_200_OK
    assert r.data["status"] == ClaimState.SUBMITTED.value


@pytest.mark.django_db
def test_submit_for_auto_approval_api_returns_checks():
    user, policy, claim = _base_setup(min_age=90, max_age=99)
    client = APIClient()
    client.force_authenticate(user=user)
    url = reverse("claim-submit-for-auto-approval", kwargs={"pk": claim.pk})
    r = client.post(url, {}, format="json")
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert "checks" in r.data
    assert isinstance(r.data["checks"], list)
    assert len(r.data["checks"]) >= 1
