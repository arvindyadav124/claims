from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
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
