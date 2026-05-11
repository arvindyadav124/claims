from django.db import migrations, models

# Legacy string statuses (pre–state machine) → new integer codes.
_CLAIM_LEGACY = {
    "submitted": 2,
    "under_review": 3,
    "approved": 5,
    "denied": 6,
}
_LINE_LEGACY = {
    "submitted": 1,
    "under_review": 4,
    "approved": 2,
    "denied": 3,
}

_CLAIM_STATUS_CHOICES = [
    (1, "Draft"),
    (2, "Submitted"),
    (3, "In Review"),
    (4, "Partially Approved"),
    (5, "Approved"),
    (6, "Denied"),
    (7, "Paid"),
]
_LINE_STATUS_CHOICES = [
    (1, "Pending"),
    (2, "Approved"),
    (3, "Denied"),
    (4, "Manual Review"),
]


def forwards_statuses(apps, schema_editor):
    Claim = apps.get_model("claims", "Claim")
    ClaimLineItem = apps.get_model("claims", "ClaimLineItem")
    for row in Claim.objects.all().iterator():
        row.status_new = _CLAIM_LEGACY.get(row.status, 1)
        row.save(update_fields=["status_new"])
    for row in ClaimLineItem.objects.all().iterator():
        row.status_new = _LINE_LEGACY.get(row.status, 1)
        row.save(update_fields=["status_new"])


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("claims", "0004_disputes"),
    ]

    operations = [
        migrations.AddField(
            model_name="claim",
            name="status_new",
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name="claimlineitem",
            name="status_new",
            field=models.IntegerField(null=True),
        ),
        migrations.RunPython(forwards_statuses, reverse_noop),
        migrations.RemoveField(
            model_name="claim",
            name="status",
        ),
        migrations.RemoveField(
            model_name="claimlineitem",
            name="status",
        ),
        migrations.RenameField(
            model_name="claim",
            old_name="status_new",
            new_name="status",
        ),
        migrations.RenameField(
            model_name="claimlineitem",
            old_name="status_new",
            new_name="status",
        ),
        migrations.AlterField(
            model_name="claim",
            name="status",
            field=models.IntegerField(choices=_CLAIM_STATUS_CHOICES, default=1),
        ),
        migrations.AlterField(
            model_name="claimlineitem",
            name="status",
            field=models.IntegerField(choices=_LINE_STATUS_CHOICES, default=1),
        ),
    ]
