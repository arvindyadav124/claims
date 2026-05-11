from decimal import Decimal

from django.conf import settings
from django.db import models


class MemberPolicy(models.Model):
    """A member's purchase of a policy (snapshot price and validity)."""

    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="member_policies",
    )
    policy = models.ForeignKey(
        "policies.Policy",
        on_delete=models.PROTECT,
        related_name="member_policies",
    )
    purchasing_date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    valid_up_to = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_member_policies",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_member_policies",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "member_policies"
        ordering = ["-purchasing_date", "-id"]

    def __str__(self) -> str:
        return f"MemberPolicy {self.pk} (member={self.member_id}, policy={self.policy_id})"
