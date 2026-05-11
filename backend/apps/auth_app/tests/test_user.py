import jwt
from django.conf import settings

import pytest

from apps.auth_app.models import User


@pytest.mark.django_db
def test_create_user_manager():
    u = User.objects.create_user("u@example.com", "secret")
    assert u.email == "u@example.com"
    assert u.check_password("secret")
    assert u.is_staff is False


@pytest.mark.django_db
def test_generate_jwt_token_roundtrip():
    u = User.objects.create_user("jwt@example.com", "secret")
    token = u.generate_jwt_token()
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[getattr(settings, "JWT_ALGORITHM", "HS256")],
    )
    assert decoded["sub"] == str(u.pk)
    assert decoded["email"] == u.email
