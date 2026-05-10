from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.claims import services
from apps.claims.state_machine import DisputeState
from apps.policies import services as policy_services
from apps.policies.models import Policy


@pytest.mark.django_db
def test_dispute_create_and_list_for_claim():
    p = policy_services.policy_create(
        name="Plan",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-D1", amount_cents=100)
    d = services.dispute_create(
        claim=c,
        reason="Amount incorrect",
    )
    assert d.status == DisputeState.DRAFT.value
    rows = list(services.disputes_for_claim(claim_id=c.pk))
    assert len(rows) == 1
    assert rows[0].pk == d.pk


@pytest.mark.django_db
def test_disputes_list_url_not_shadowed():
    client = APIClient()
    r = client.get(reverse("dispute-list"))
    assert r.status_code == status.HTTP_200_OK
