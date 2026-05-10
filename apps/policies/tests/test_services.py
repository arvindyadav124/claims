from datetime import date

import pytest

from apps.members import services as member_services
from apps.policies import services


@pytest.mark.django_db
def test_policy_create_for_member():
    m = member_services.member_create(first_name="A", last_name="B", email="p@example.com")
    p = services.policy_create(member=m, policy_number="POL-1", effective_date=date(2026, 1, 1))
    listed = list(services.policies_for_member(member_id=m.pk))
    assert len(listed) == 1
    assert listed[0].pk == p.pk
