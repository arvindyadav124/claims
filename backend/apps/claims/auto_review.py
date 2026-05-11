"""
Rules for submit-for-auto-approval (draft → submitted).

Uses member profile + member_policies enrollment, policy items (diagnosis limits),
and approved/paid claim counts per calendar year.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.utils import timezone

from apps.claims.models import Claim, ClaimLineItem
from apps.claims.state_machine import ClaimState
from apps.member_policies.models import MemberPolicy
from apps.members.models import Member
from apps.policies.models import Policy, PolicyItem


def _norm_code(value: str) -> str:
    return value.strip().upper()


def _age_on_date(*, dob: date, today: date) -> int:
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age


def _member_matches_policy_gender(*, member: Member, policy: Policy) -> bool:
    if policy.eligible_gender == Policy.EligibleGender.BOTH:
        return True
    if policy.eligible_gender == Policy.EligibleGender.MALE:
        return member.gender == Member.Gender.M
    if policy.eligible_gender == Policy.EligibleGender.FEMALE:
        return member.gender == Member.Gender.F
    return False


def _policy_items_by_diagnosis(*, policy_id: int) -> dict[str, PolicyItem]:
    out: dict[str, PolicyItem] = {}
    for row in PolicyItem.objects.filter(policy_id=policy_id).order_by("id"):
        key = _norm_code(row.diagnosis_code)
        if key not in out:
            out[key] = row
    return out


def _approved_claims_count_for_diagnosis(
    *,
    policy_id: int,
    user_id: int,
    year: int,
    diagnosis_code: str,
    exclude_claim_id: int,
) -> int:
    """Claims in APPROVED or PAID for this user/policy/year that include this diagnosis (any line)."""
    code = diagnosis_code.strip()
    return (
        Claim.objects.filter(
            policy_id=policy_id,
            created_by_id=user_id,
            status__in=(ClaimState.APPROVED.value, ClaimState.PAID.value),
            created_at__year=year,
        )
        .exclude(pk=exclude_claim_id)
        .filter(line_items__diagnosis_code__iexact=code)
        .distinct()
        .count()
    )


def collect_auto_approval_violations(*, claim: Claim, user) -> list[str]:
    """
    Return human-readable violation messages. Empty list means all checks passed.
    Caller must ensure claim is in DRAFT and user is authenticated.

    Eligibility is evaluated for the claim's creator when present (``created_by``),
    otherwise the current request user — so the enrolled member matches who filed the claim.
    """
    errors: list[str] = []
    today = timezone.now().date()
    year = today.year

    subject = claim.created_by or user

    try:
        member = Member.objects.select_related("user").get(user_id=subject.pk)
    except Member.DoesNotExist:
        return ["A member profile is required. Link your account to a member record before submitting."]

    policy = claim.policy
    if policy.status != Policy.Status.ACTIVE:
        errors.append("This policy is not active; claims cannot be auto-submitted against it.")

    if not MemberPolicy.objects.filter(
        member=member,
        policy_id=policy.pk,
        purchasing_date__lte=today,
        valid_up_to__gte=today,
    ).exists():
        errors.append("You do not have an active enrollment for this policy.")

    age = _age_on_date(dob=member.dob, today=today)
    if age < policy.min_age or age > policy.max_age:
        errors.append(
            f"Member age ({age}) is outside the policy allowed range ({policy.min_age}–{policy.max_age})."
        )

    if not _member_matches_policy_gender(member=member, policy=policy):
        errors.append("Member gender is not eligible for this policy.")

    lines: list[ClaimLineItem] = list(claim.line_items.all().order_by("id"))
    if not lines:
        errors.append("The claim must have at least one line item before submission.")
        return errors

    items_by_dx = _policy_items_by_diagnosis(policy_id=policy.pk)
    cover = Decimal(policy.total_cover)
    if cover <= 0:
        errors.append("Policy total cover is invalid.")
        return errors

    distinct_dx_for_limits: set[str] = set()

    for line in lines:
        key = _norm_code(line.diagnosis_code)
        if not key:
            errors.append("Each line item must have a non-empty diagnosis code.")
            continue
        pol_item = items_by_dx.get(key)
        if pol_item is None:
            errors.append(
                f"Diagnosis code {line.diagnosis_code!r} is not covered by this policy "
                f"(no matching policy item)."
            )
            continue

        if line.amount > pol_item.max_yearly_limit:
            errors.append(
                f"Line {line.diagnosis_code!r}: amount {line.amount} exceeds the policy per-diagnosis "
                f"limit {pol_item.max_yearly_limit}."
            )

        pct = (line.amount / cover) * Decimal(100)
        if pct > Decimal(pol_item.max_percent_of_policy):
            errors.append(
                f"Line {line.diagnosis_code!r}: requested amount is {pct.quantize(Decimal('0.01'))}% of total "
                f"cover, which exceeds the policy maximum of {pol_item.max_percent_of_policy}%."
            )

        distinct_dx_for_limits.add(_norm_code(pol_item.diagnosis_code))

    if errors:
        return errors

    uid = subject.pk
    for dx_key in distinct_dx_for_limits:
        pol_item = items_by_dx[dx_key]
        used = _approved_claims_count_for_diagnosis(
            policy_id=policy.pk,
            user_id=uid,
            year=year,
            diagnosis_code=pol_item.diagnosis_code,
            exclude_claim_id=claim.pk,
        )
        if used >= pol_item.max_claims_per_year:
            errors.append(
                f"Maximum approved claims per year ({pol_item.max_claims_per_year}) for diagnosis "
                f"{pol_item.diagnosis_code!r} has been reached for your account on this policy."
            )

    return errors
