from django.db.models import Prefetch, QuerySet

from apps.policies.models import Policy, PolicyItem


def _policy_queryset_with_items() -> QuerySet[Policy]:
    item_qs = PolicyItem.objects.order_by("diagnosis_code")
    return Policy.objects.prefetch_related(Prefetch("items", queryset=item_qs))


def policy_create(
    *,
    name: str,
    price,
    min_age: int,
    max_age: int,
    eligible_gender: str,
    created_by=None,
    updated_by=None,
) -> Policy:
    return Policy.objects.create(
        name=name,
        price=price,
        min_age=min_age,
        max_age=max_age,
        eligible_gender=eligible_gender,
        created_by=created_by,
        updated_by=updated_by,
    )


def policy_get(pk: int) -> Policy:
    return _policy_queryset_with_items().get(pk=pk)


def policy_list() -> QuerySet[Policy]:
    return _policy_queryset_with_items().order_by("name")


def policy_item_create(
    *,
    policy: Policy,
    diagnosis_code: str,
    max_percent_of_policy: int,
    max_yearly_limit,
    max_claims_per_year: int,
    created_by=None,
    updated_by=None,
) -> PolicyItem:
    return PolicyItem.objects.create(
        policy=policy,
        diagnosis_code=diagnosis_code,
        max_percent_of_policy=max_percent_of_policy,
        max_yearly_limit=max_yearly_limit,
        max_claims_per_year=max_claims_per_year,
        created_by=created_by,
        updated_by=updated_by,
    )


def policy_item_get(pk: int) -> PolicyItem:
    return PolicyItem.objects.select_related("policy").get(pk=pk)


def policy_items_for_policy(*, policy_id: int) -> QuerySet[PolicyItem]:
    return PolicyItem.objects.filter(policy_id=policy_id).select_related("policy").order_by("diagnosis_code")
