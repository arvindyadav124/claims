import pytest

from apps.members import services
from apps.members.tests.support import create_test_member


@pytest.mark.django_db
def test_member_create_and_get():
    m, _user = create_test_member(email="svc-a@example.com")
    assert services.member_get(pk=m.pk).email == "svc-a@example.com"
    assert m.mobile == "5550100200"
    assert m.user_id is not None
