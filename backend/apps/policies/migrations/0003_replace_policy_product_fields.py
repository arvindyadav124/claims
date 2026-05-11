from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("policies", "0002_policy_audit_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="policy",
            name="name",
            field=models.CharField(default="Legacy policy", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="policy",
            name="price",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=10),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="policy",
            name="min_age",
            field=models.PositiveSmallIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="policy",
            name="max_age",
            field=models.PositiveSmallIntegerField(default=120),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="policy",
            name="eligible_gender",
            field=models.CharField(
                choices=[("male", "Male"), ("female", "Female"), ("both", "Both")],
                default="both",
                max_length=10,
            ),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name="policy",
            name="member",
        ),
        migrations.RemoveField(
            model_name="policy",
            name="policy_number",
        ),
        migrations.RemoveField(
            model_name="policy",
            name="effective_date",
        ),
    ]
