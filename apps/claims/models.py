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
    filed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Claims"

    def __str__(self) -> str:
        return self.claim_number
