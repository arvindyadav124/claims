import pytest
from rest_framework.test import APIRequestFactory

from apps.auth_app.authentication import JWTAuthentication
from apps.auth_app.models import User


@pytest.mark.django_db
def test_jwt_authentication_accepts_bearer_token():
    user = User.objects.create_user("jwt-auth@example.com", "secret-pass-123!")
    token = user.generate_jwt_token()
    factory = APIRequestFactory()
    request = factory.get("/dummy/", HTTP_AUTHORIZATION=f"Bearer {token}")
    auth_user, auth_token = JWTAuthentication().authenticate(request)
    assert auth_user.pk == user.pk
    assert auth_token == token
