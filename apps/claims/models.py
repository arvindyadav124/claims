from django.conf import settings
from django.db import models

from apps.policies.models import Policy


class Claim(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        APPROVED = "approved", "Approved"
        DENIED = "denied", "Denied"

    policy = models.ForeignKey(Policy, on_delete=models.PROTECT, related_name="claims")
    claim_number = models.CharField(max_length=64, unique=True)
    amount_cents = models.PositiveIntegerField()
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.SUBMITTED)
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_claims",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_claims",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_claims",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Claims"

    def __str__(self) -> str:
        return self.claim_number


class ClaimLineItem(models.Model):
    claim = models.ForeignKey(
        Claim,
        on_delete=models.CASCADE,
        related_name="line_items",
    )
    diagnosis_code = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=32,
        choices=Claim.Status.choices,
        default=Claim.Status.SUBMITTED,
    )
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_claim_line_items",
    )

    class Meta:
        db_table = "claim_line_items"
        verbose_name_plural = "Claim line items"

    def __str__(self) -> str:
        return f"{self.diagnosis_code} (claim {self.claim_id})"


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        UNDER_REVIEW = "under_review", "Under review"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    claim = models.ForeignKey(
        Claim,
        on_delete=models.CASCADE,
        related_name="disputes",
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.OPEN,
    )
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_disputes",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_disputes",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_disputes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "disputes"
        verbose_name_plural = "Disputes"

    def __str__(self) -> str:
        return f"Dispute {self.pk} on {self.claim_id}"
