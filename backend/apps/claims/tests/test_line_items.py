from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.claims import services
from apps.claims.state_machine import ClaimLineItemState
from apps.policies import services as policy_services
from apps.policies.models import Policy

User = get_user_model()


@pytest.mark.django_db
def test_claim_line_item_create_and_list():
    p = policy_services.policy_create(
        name="Plan",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-L1", amount_cents=5000)
    li = services.claim_line_item_create(
        claim=c,
        diagnosis_code="Z00",
        amount=Decimal("100.50"),
    )
    assert li.status == ClaimLineItemState.PENDING.value
    rows = list(services.claim_line_items_for_claim(claim_id=c.pk))
    assert len(rows) == 1
    assert rows[0].pk == li.pk


@pytest.mark.django_db
def test_claim_line_items_list_url():
    u = User.objects.create_user(email="line-item-list@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    client.force_authenticate(user=u)
    url = reverse("claim-line-item-list")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
