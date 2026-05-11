import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.auth_app.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_register_success(api_client):
    r = api_client.post(
        "/api/auth/register",
        {
            "email": "new@example.com",
            "password": "strong-pass-123!",
            "password_confirm": "strong-pass-123!",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["email"] == "new@example.com"
    assert User.objects.filter(email="new@example.com").exists()


@pytest.mark.django_db
def test_register_password_mismatch(api_client):
    r = api_client.post(
        "/api/auth/register",
        {
            "email": "a@example.com",
            "password": "strong-pass-123!",
            "password_confirm": "other",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_duplicate_email(api_client):
    User.objects.create_user("dup@example.com", "strong-pass-123!")
    r = api_client.post(
        "/api/auth/register",
        {
            "email": "dup@example.com",
            "password": "strong-pass-123!",
            "password_confirm": "strong-pass-123!",
        },
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_login_returns_token(api_client):
    User.objects.create_user("login@example.com", "strong-pass-123!")
    r = api_client.post(
        "/api/auth/login",
        {"email": "login@example.com", "password": "strong-pass-123!"},
        format="json",
    )
    assert r.status_code == status.HTTP_200_OK
    assert "token" in r.data


@pytest.mark.django_db
def test_login_invalid_credentials(api_client):
    User.objects.create_user("x@example.com", "strong-pass-123!")
    r = api_client.post(
        "/api/auth/login",
        {"email": "x@example.com", "password": "wrong"},
        format="json",
    )
    assert r.status_code == status.HTTP_400_BAD_REQUEST
