from django.conf import settings
from django.db import models

from apps.claims.state_machine import (
    ClaimLineItemState,
    ClaimState,
    claim_state_label,
    line_item_state_label,
)
from apps.policies.models import Policy

CLAIM_STATUS_CHOICES = [(s.value, claim_state_label(s)) for s in ClaimState]
LINE_ITEM_STATUS_CHOICES = [(s.value, line_item_state_label(s)) for s in ClaimLineItemState]


class Claim(models.Model):
    policy = models.ForeignKey(Policy, on_delete=models.PROTECT, related_name="claims")
    claim_number = models.CharField(max_length=64, unique=True)
    amount_cents = models.PositiveIntegerField()
    status = models.IntegerField(choices=CLAIM_STATUS_CHOICES, default=ClaimState.DRAFT.value)
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
    status = models.IntegerField(choices=LINE_ITEM_STATUS_CHOICES, default=ClaimLineItemState.PENDING.value)
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
