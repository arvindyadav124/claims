from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.claims.models import Claim
from apps.member_policies import services as mp_services
from apps.members.tests.support import create_test_member
from apps.policies import services as policy_services
from apps.policies.models import Policy

User = get_user_model()


@pytest.mark.django_db
def test_api_create_claim_requires_active_member_policy():
    member, user = create_test_member(email="claim-enroll@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    policy = policy_services.policy_create(
        name="Enroll Plan",
        price=Decimal("80.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    url = reverse("claim-list")
    today = timezone.now().date()

    r = client.post(
        url,
        {"policy": policy.pk, "claim_number": "CLM-NO-ENROLL", "amount_cents": 100},
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert "policy" in r.data
    assert Claim.objects.filter(claim_number="CLM-NO-ENROLL").count() == 0

    mp_services.member_policy_create(
        member=member,
        policy=policy,
        purchasing_date=today - timedelta(days=5),
        price=Decimal("80.00"),
        valid_up_to=today + timedelta(days=300),
        created_by=user,
        updated_by=user,
    )

    r = client.post(
        url,
        {"policy": policy.pk, "claim_number": "CLM-OK-1", "amount_cents": 250},
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["policy"] == policy.pk
    assert Claim.objects.filter(claim_number="CLM-OK-1").exists()
