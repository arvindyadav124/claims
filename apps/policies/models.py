from django.db import models

from apps.members.models import Member


class Policy(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELLED = "cancelled", "Cancelled"

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="policies")
    policy_number = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    effective_date = models.DateField()

    class Meta:
        verbose_name_plural = "Policies"

    def __str__(self) -> str:
        return self.policy_number
