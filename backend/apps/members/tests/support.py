"""Shared helpers for member-related tests (required profile fields)."""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model

from apps.members import services

if TYPE_CHECKING:
    from apps.members.models import Member

User = get_user_model()


def create_test_member(
    *,
    email: str | None = None,
    password: str = "Zz9!test-password-long",
    first_name: str = "Test",
    last_name: str = "Member",
    mobile: str = "5550100200",
    dob: date | None = None,
    gender: str = "m",
) -> tuple["Member", User]:
    if email is None:
        email = f"mem-{id(object())}@example.com"
    if dob is None:
        dob = date(1990, 1, 15)
    user = User.objects.create_user(email=email, password=password)
    member = services.member_create(
        first_name=first_name,
        last_name=last_name,
        email=email,
        user=user,
        dob=dob,
        gender=gender,
        mobile=mobile,
    )
    return member, user
