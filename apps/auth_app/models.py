from datetime import timedelta

import jwt
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.auth_app.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("email address", unique=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.email

    def generate_jwt_token(self) -> str:
        now = timezone.now()
        lifetime = timedelta(seconds=getattr(settings, "JWT_ACCESS_TOKEN_LIFETIME_SECONDS", 86400))
        payload = {
            "sub": str(self.pk),
            "email": self.email,
            "iat": now,
            "exp": now + lifetime,
        }
        algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=algorithm)
