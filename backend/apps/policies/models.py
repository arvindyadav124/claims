from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models


class Policy(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELLED = "cancelled", "Cancelled"

    class EligibleGender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        BOTH = "both", "Both"

    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    min_age = models.PositiveSmallIntegerField(default=0)
    max_age = models.PositiveSmallIntegerField(default=120)
    eligible_gender = models.CharField(
        max_length=10,
        choices=EligibleGender.choices,
        default=EligibleGender.BOTH,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_policies",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_policies",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Policies"

    def __str__(self) -> str:
        return self.name


class PolicyItem(models.Model):
    """Line-level coverage rules linked to a policy (one policy, many items)."""

    policy = models.ForeignKey(
        Policy,
        on_delete=models.CASCADE,
        related_name="items",
    )
    diagnosis_code = models.CharField(max_length=32)
    max_percent_of_policy = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(100)],
    )
    max_yearly_limit = models.DecimalField(max_digits=12, decimal_places=2)
    max_claims_per_year = models.PositiveIntegerField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_policy_items",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_policy_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "policy_items"
        verbose_name_plural = "Policy items"

    def __str__(self) -> str:
        return f"{self.diagnosis_code} ({self.policy_id})"
