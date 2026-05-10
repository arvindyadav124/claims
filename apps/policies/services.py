from datetime import date

from django.db.models import QuerySet

from apps.members.models import Member
from apps.policies.models import Policy


def policy_create(*, member: Member, policy_number: str, effective_date: date) -> Policy:
    return Policy.objects.create(member=member, policy_number=policy_number, effective_date=effective_date)


def policy_get(pk: int) -> Policy:
    return Policy.objects.select_related("member").get(pk=pk)


def policies_for_member(*, member_id: int) -> QuerySet[Policy]:
    return Policy.objects.filter(member_id=member_id).select_related("member").order_by("-effective_date")
