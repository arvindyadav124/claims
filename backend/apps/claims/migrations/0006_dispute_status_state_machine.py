from django.db import migrations, models

_DISPUTE_LEGACY = {
    "open": 2,
    "under_review": 3,
    "resolved": 4,
    "rejected": 4,
}

_DISPUTE_STATUS_CHOICES = [
    (1, "Draft"),
    (2, "Submitted"),
    (3, "In Review"),
    (4, "Resolved"),
]


def forwards_dispute_statuses(apps, schema_editor):
    Dispute = apps.get_model("claims", "Dispute")
    for row in Dispute.objects.all().iterator():
        row.status_new = _DISPUTE_LEGACY.get(row.status, 1)
        row.save(update_fields=["status_new"])


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("claims", "0005_status_state_machine"),
    ]

    operations = [
        migrations.AddField(
            model_name="dispute",
            name="status_new",
            field=models.IntegerField(null=True),
        ),
        migrations.RunPython(forwards_dispute_statuses, reverse_noop),
        migrations.RemoveField(
            model_name="dispute",
            name="status",
        ),
        migrations.RenameField(
            model_name="dispute",
            old_name="status_new",
            new_name="status",
        ),
        migrations.AlterField(
            model_name="dispute",
            name="status",
            field=models.IntegerField(choices=_DISPUTE_STATUS_CHOICES, default=1),
        ),
    ]
