from datetime import date

from django.db.models import QuerySet

from apps.member_policies.models import MemberPolicy
from apps.members.models import Member


def member_policy_create(
    *,
    member,
    policy,
    purchasing_date,
    price,
    valid_up_to,
    created_by=None,
    updated_by=None,
) -> MemberPolicy:
    return MemberPolicy.objects.create(
        member=member,
        policy=policy,
        purchasing_date=purchasing_date,
        price=price,
        valid_up_to=valid_up_to,
        created_by=created_by,
        updated_by=updated_by,
    )


def member_policy_get(pk: int) -> MemberPolicy:
    return (
        MemberPolicy.objects.select_related("member", "policy", "created_by", "updated_by")
        .filter(pk=pk)
        .get()
    )


def member_policy_list(
    *,
    member_id: int | None = None,
    policy_id: int | None = None,
    user_id_for_mine: int | None = None,
    active_on: date | None = None,
) -> QuerySet[MemberPolicy]:
    qs = MemberPolicy.objects.select_related("member", "policy", "created_by", "updated_by").all()
    if user_id_for_mine is not None:
        try:
            member_pk = Member.objects.only("id").get(user_id=user_id_for_mine).pk
        except Member.DoesNotExist:
            return MemberPolicy.objects.none()
        qs = qs.filter(member_id=member_pk)
    elif member_id is not None:
        qs = qs.filter(member_id=member_id)
    if policy_id is not None:
        qs = qs.filter(policy_id=policy_id)
    if active_on is not None:
        qs = qs.filter(purchasing_date__lte=active_on, valid_up_to__gte=active_on)
    return qs.order_by("-purchasing_date", "-id")


def member_policy_update(*, instance: MemberPolicy, updated_by=None, **kwargs) -> MemberPolicy:
    for field in ("member", "policy", "purchasing_date", "price", "valid_up_to"):
        if field in kwargs:
            setattr(instance, field, kwargs[field])
    if updated_by is not None:
        instance.updated_by = updated_by
    instance.save()
    return member_policy_get(pk=instance.pk)


def member_policy_delete(*, instance: MemberPolicy) -> None:
    instance.delete()
