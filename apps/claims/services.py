from django.db.models import QuerySet

from apps.claims.models import Claim, ClaimLineItem, Dispute
from apps.policies.models import Policy


def claim_submit(*, policy: Policy, claim_number: str, amount_cents: int) -> Claim:
    return Claim.objects.create(policy=policy, claim_number=claim_number, amount_cents=amount_cents)


def claim_get(pk: int) -> Claim:
    return Claim.objects.select_related("policy", "checked_by").get(pk=pk)


def claims_for_policy(*, policy_id: int) -> QuerySet[Claim]:
    return Claim.objects.filter(policy_id=policy_id).select_related("policy", "checked_by").order_by("-created_at")


def claim_line_item_create(**kwargs) -> ClaimLineItem:
    return ClaimLineItem.objects.create(**kwargs)


def claim_line_item_get(pk: int) -> ClaimLineItem:
    return ClaimLineItem.objects.select_related("claim", "checked_by").get(pk=pk)


def claim_line_items_for_claim(*, claim_id: int) -> QuerySet[ClaimLineItem]:
    return ClaimLineItem.objects.filter(claim_id=claim_id).select_related("claim", "checked_by").order_by("id")


def dispute_create(**kwargs) -> Dispute:
    return Dispute.objects.create(**kwargs)


def dispute_get(pk: int) -> Dispute:
    return Dispute.objects.select_related("claim", "checked_by", "created_by", "updated_by").get(pk=pk)


def disputes_for_claim(*, claim_id: int) -> QuerySet[Dispute]:
    return (
        Dispute.objects.filter(claim_id=claim_id)
        .select_related("claim", "checked_by", "created_by", "updated_by")
        .order_by("-created_at")
    )
