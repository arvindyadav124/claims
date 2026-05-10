from decimal import Decimal

import pytest

from apps.members import services as member_services
from apps.policies import services
from apps.policies.models import Policy


@pytest.mark.django_db
def test_policy_create_and_list():
    member_services.member_create(first_name="A", last_name="B", email="p@example.com")
    p = services.policy_create(
        name="Gold Plan",
        price=Decimal("199.99"),
        min_age=18,
        max_age=65,
        eligible_gender=Policy.EligibleGender.BOTH,
    )
    listed = list(services.policy_list())
    assert len(listed) == 1
    assert listed[0].pk == p.pk
    assert listed[0].name == "Gold Plan"
