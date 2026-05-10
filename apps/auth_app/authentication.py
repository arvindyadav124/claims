import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    Validates Bearer tokens produced by ``User.generate_jwt_token()`` (HS256 + SECRET_KEY).
    """

    keyword = "Bearer"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION")
        if not header or not header.startswith(f"{self.keyword} "):
            return None

        raw = header[len(self.keyword) + 1 :].strip()
        if not raw:
            return None

        algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")
        try:
            payload = jwt.decode(raw, settings.SECRET_KEY, algorithms=[algorithm])
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed("Invalid or expired token.") from exc

        sub = payload.get("sub")
        if sub is None:
            raise AuthenticationFailed("Invalid token payload.")

        try:
            user = User.objects.get(pk=int(sub))
        except (User.DoesNotExist, ValueError, TypeError) as exc:
            raise AuthenticationFailed("User not found.") from exc

        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        return (user, raw)

    def authenticate_header(self, request):
        return self.keyword
