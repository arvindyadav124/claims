from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("policies", "0005_policyitem_percent_integer"),
    ]

    operations = [
        migrations.AddField(
            model_name="policy",
            name="total_cover",
            field=models.PositiveBigIntegerField(default=5_000_000),
            preserve_default=False,
        ),
    ]
