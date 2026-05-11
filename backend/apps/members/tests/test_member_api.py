import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.members.tests.support import create_test_member

User = get_user_model()


@pytest.mark.django_db
def test_member_create_requires_authentication():
    u = User.objects.create_user(email="anon-block@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    r = client.post(
        reverse("member-list"),
        {
            "first_name": "A",
            "last_name": "B",
            "user": u.pk,
            "dob": "1990-05-01",
            "gender": "m",
            "mobile": "5551112222",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_member_create_success_with_jwt():
    u = User.objects.create_user(email="jwt-mem@example.com", password="Xx9!long-pass-word")
    client = APIClient()
    client.force_authenticate(user=u)
    r = client.post(
        reverse("member-list"),
        {
            "first_name": "Jane",
            "last_name": "Doe",
            "user": u.pk,
            "dob": "1992-03-15",
            "gender": "f",
            "mobile": "5553334444",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["email"] == "jwt-mem@example.com"
    assert r.data["first_name"] == "Jane"


@pytest.mark.django_db
def test_member_duplicate_user_returns_message():
    create_test_member(email="dup-user@example.com")
    u = User.objects.get(email="dup-user@example.com")
    client = APIClient()
    client.force_authenticate(user=u)
    r = client.post(
        reverse("member-list"),
        {
            "first_name": "X",
            "last_name": "Y",
            "user": u.pk,
            "dob": "1991-01-01",
            "gender": "m",
            "mobile": "5559990000",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert "user" in r.data
    assert "already exists" in str(r.data["user"]).lower()
