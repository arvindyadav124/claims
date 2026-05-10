from django.db.models import QuerySet

from apps.members.models import Member


def member_create(*, first_name: str, last_name: str, email: str) -> Member:
    return Member.objects.create(first_name=first_name, last_name=last_name, email=email)


def member_get(pk: int) -> Member:
    return Member.objects.get(pk=pk)


def member_list() -> QuerySet[Member]:
    return Member.objects.all().order_by("last_name", "first_name")
