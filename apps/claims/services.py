from django.db.models import QuerySet

from apps.claims.models import Claim
from apps.policies.models import Policy


def claim_submit(*, policy: Policy, claim_number: str, amount_cents: int) -> Claim:
    return Claim.objects.create(policy=policy, claim_number=claim_number, amount_cents=amount_cents)


def claim_get(pk: int) -> Claim:
    return Claim.objects.select_related("policy", "policy__member").get(pk=pk)


def claims_for_policy(*, policy_id: int) -> QuerySet[Claim]:
    return Claim.objects.filter(policy_id=policy_id).select_related("policy").order_by("-filed_at")
