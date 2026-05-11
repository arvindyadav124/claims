from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.policies import services
from apps.policies.models import Policy

User = get_user_model()


@pytest.mark.django_db
def test_policy_item_create_and_list_for_policy():
    p = services.policy_create(
        name="Plan A",
        price=Decimal("100.00"),
        min_age=18,
        max_age=65,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    i1 = services.policy_item_create(
        policy=p,
        diagnosis_code="A01",
        max_percent_of_policy=80,
        max_yearly_limit=Decimal("5000.00"),
        max_claims_per_year=3,
    )
    i2 = services.policy_item_create(
        policy=p,
        diagnosis_code="B02",
        max_percent_of_policy=50,
        max_yearly_limit=Decimal("2000.00"),
        max_claims_per_year=1,
    )
    rows = list(services.policy_items_for_policy(policy_id=p.pk))
    assert {r.pk for r in rows} == {i1.pk, i2.pk}


@pytest.mark.django_db
def test_policy_items_api_list_filter_by_policy_id():
    p = services.policy_create(
        name="Plan B",
        price=Decimal("50.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    services.policy_item_create(
        policy=p,
        diagnosis_code="X99",
        max_percent_of_policy=100,
        max_yearly_limit=Decimal("10000.00"),
        max_claims_per_year=5,
    )
    u = User.objects.create_user(email="pol-item-filter@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    client.force_authenticate(user=u)
    url = reverse("policy-item-list")
    r = client.get(url, {"policy_id": p.pk})
    assert r.status_code == status.HTTP_200_OK
    assert len(r.data) == 1
    assert r.data[0]["diagnosis_code"] == "X99"


@pytest.mark.django_db
def test_policy_items_url_not_shadowed_by_policy_pk():
    """`/items` must not be routed as a policy detail with pk='items'."""
    u = User.objects.create_user(email="pol-item-shadow@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    client.force_authenticate(user=u)
    url = reverse("policy-item-list")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
