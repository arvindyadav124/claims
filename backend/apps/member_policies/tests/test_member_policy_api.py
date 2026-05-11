from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.member_policies.models import MemberPolicy
from apps.members.tests.support import create_test_member
from apps.policies import services as policy_services
from apps.policies.models import Policy

User = get_user_model()


@pytest.fixture
def policy():
    return policy_services.policy_create(
        name="Plan MP",
        price=Decimal("99.00"),
        min_age=18,
        max_age=65,
        eligible_gender=Policy.EligibleGender.BOTH,
    )


@pytest.fixture
def member_and_user():
    return create_test_member(email="mp-owner@example.com")


@pytest.fixture
def auth_client(member_and_user):
    _member, user = member_and_user
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_member_policy_requires_auth(policy, member_and_user):
    member, _user = member_and_user
    client = APIClient()
    r = client.post(
        reverse("member-policy-list"),
        {
            "member": member.pk,
            "policy": policy.pk,
            "purchasing_date": "2026-01-10",
            "price": "99.00",
            "valid_up_to": "2026-12-31",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_member_policy_crud(auth_client, policy, member_and_user):
    member, user = member_and_user
    list_url = reverse("member-policy-list")

    r = auth_client.post(
        list_url,
        {
            "member": member.pk,
            "policy": policy.pk,
            "purchasing_date": "2026-01-10",
            "price": "120.50",
            "valid_up_to": "2026-12-31",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    mp_id = r.data["id"]
    assert r.data["price"] == "120.50"
    assert r.data["member"] == member.pk
    assert MemberPolicy.objects.get(pk=mp_id).created_by_id == user.pk

    r = auth_client.get(list_url, {"member_id": member.pk})
    assert r.status_code == status.HTTP_200_OK
    assert len(r.data) == 1

    detail_url = reverse("member-policy-detail", kwargs={"pk": mp_id})
    r = auth_client.get(detail_url)
    assert r.status_code == status.HTTP_200_OK
    assert r.data["policy"] == policy.pk

    r = auth_client.patch(detail_url, {"price": "130.00"}, format="json")
    assert r.status_code == status.HTTP_200_OK
    assert r.data["price"] == "130.00"
    assert MemberPolicy.objects.get(pk=mp_id).updated_by_id == user.pk

    r = auth_client.delete(detail_url)
    assert r.status_code == status.HTTP_204_NO_CONTENT
    assert not MemberPolicy.objects.filter(pk=mp_id).exists()


@pytest.mark.django_db
def test_member_policy_mine_lists_active_enrollment_only(auth_client, policy, member_and_user):
    member, _user = member_and_user
    list_url = reverse("member-policy-list")
    today = timezone.now().date()

    r = auth_client.get(list_url, {"mine": "1"})
    assert r.status_code == status.HTTP_200_OK
    assert r.data == []

    r = auth_client.post(
        list_url,
        {
            "member": member.pk,
            "policy": policy.pk,
            "purchasing_date": (today - timedelta(days=1)).isoformat(),
            "price": "99.00",
            "valid_up_to": (today + timedelta(days=30)).isoformat(),
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED

    r = auth_client.get(list_url, {"mine": "1"})
    assert r.status_code == status.HTTP_200_OK
    assert len(r.data) == 1
    assert r.data[0]["policy"] == policy.pk

    expired = policy_services.policy_create(
        name="Expired Plan",
        price=Decimal("50.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    r = auth_client.post(
        list_url,
        {
            "member": member.pk,
            "policy": expired.pk,
            "purchasing_date": (today - timedelta(days=400)).isoformat(),
            "price": "50.00",
            "valid_up_to": (today - timedelta(days=1)).isoformat(),
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED

    r = auth_client.get(list_url, {"mine": "1"})
    assert len(r.data) == 1
    assert r.data[0]["policy"] == policy.pk
