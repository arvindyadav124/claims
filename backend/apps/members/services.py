from django.db.models import QuerySet

from apps.members.models import Member


def member_create(**kwargs) -> Member:
    return Member.objects.create(**kwargs)


def member_get(pk: int) -> Member:
    return Member.objects.get(pk=pk)


def member_list() -> QuerySet[Member]:
    return Member.objects.all().order_by("last_name", "first_name")


def member_delete(*, instance: Member) -> None:
    instance.delete()
