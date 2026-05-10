from decimal import Decimal

import pytest

from apps.claims import services
from apps.members import services as member_services
from apps.policies import services as policy_services
from apps.policies.models import Policy


@pytest.mark.django_db
def test_claim_submit_for_policy():
    member_services.member_create(first_name="A", last_name="B", email="c@example.com")
    p = policy_services.policy_create(
        name="Silver Plan",
        price=Decimal("50.00"),
        min_age=0,
        max_age=99,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    c = services.claim_submit(policy=p, claim_number="CLM-1", amount_cents=1000)
    assert services.claim_get(pk=c.pk).amount_cents == 1000
    assert list(services.claims_for_policy(policy_id=p.pk))[0].pk == c.pk
