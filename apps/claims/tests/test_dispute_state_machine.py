from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.claims import services
from apps.claims.state_machine import DisputeState
from apps.policies import services as policy_services
from apps.policies.models import Policy

User = get_user_model()


@pytest.mark.django_db
def test_dispute_happy_path_to_resolved():
    p = policy_services.policy_create(
        name="Plan",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-DSP1", amount_cents=1)
    d = services.dispute_create(claim=c, reason="Issue")
    assert d.status == DisputeState.DRAFT.value
    d = services.dispute_transition(dispute_id=d.pk, to_status=DisputeState.SUBMITTED.value)
    d = services.dispute_transition(dispute_id=d.pk, to_status=DisputeState.IN_REVIEW.value)
    d = services.dispute_transition(dispute_id=d.pk, to_status=DisputeState.RESOLVED.value)
    assert d.status == DisputeState.RESOLVED.value


@pytest.mark.django_db
def test_dispute_cannot_skip_to_resolved():
    p = policy_services.policy_create(
        name="Plan2",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-DSP2", amount_cents=1)
    d = services.dispute_create(claim=c, reason="Issue")
    with pytest.raises(ValidationError):
        services.dispute_transition(dispute_id=d.pk, to_status=DisputeState.RESOLVED.value)


@pytest.mark.django_db
def test_dispute_transition_api():
    p = policy_services.policy_create(
        name="Plan3",
        price=Decimal("10.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-DSP3", amount_cents=1)
    d = services.dispute_create(claim=c, reason="Issue")
    u = User.objects.create_user(email="dsp-api@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    client.force_authenticate(user=u)
    url = reverse("dispute-transition", kwargs={"pk": d.pk})
    r = client.post(url, {"status": DisputeState.SUBMITTED.value}, format="json")
    assert r.status_code == status.HTTP_200_OK
    assert r.data["status"] == DisputeState.SUBMITTED.value
