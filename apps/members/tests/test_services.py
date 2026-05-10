import pytest

from apps.members import services


@pytest.mark.django_db
def test_member_create_and_get():
    m = services.member_create(first_name="A", last_name="B", email="a@example.com")
    assert services.member_get(pk=m.pk).email == "a@example.com"
