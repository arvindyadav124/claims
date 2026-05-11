from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("members", "0002_member_audit_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="member",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="member_profile",
                to=settings.AUTH_USER_MODEL,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="member",
            name="dob",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="member",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("m", "Male"), ("f", "Female")],
                max_length=1,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="member",
            name="mobile",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="member",
            name="address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="member",
            name="distt",
            field=models.CharField(blank=True, max_length=100, verbose_name="district"),
        ),
        migrations.AddField(
            model_name="member",
            name="state",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="member",
            name="pincode",
            field=models.CharField(blank=True, max_length=12),
        ),
    ]
