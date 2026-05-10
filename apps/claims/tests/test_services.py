from datetime import date

import pytest

from apps.claims import services
from apps.members import services as member_services
from apps.policies import services as policy_services


@pytest.mark.django_db
def test_claim_submit_for_policy():
    m = member_services.member_create(first_name="A", last_name="B", email="c@example.com")
    p = policy_services.policy_create(member=m, policy_number="POL-X", effective_date=date(2026, 1, 1))
    c = services.claim_submit(policy=p, claim_number="CLM-1", amount_cents=1000)
    assert services.claim_get(pk=c.pk).amount_cents == 1000
    assert list(services.claims_for_policy(policy_id=p.pk))[0].pk == c.pk
