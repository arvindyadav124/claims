from datetime import date

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def forwards_fill_and_prune(apps, schema_editor):
    Member = apps.get_model("members", "Member")
    Member.objects.filter(user_id__isnull=True).delete()
    for m in Member.objects.all().iterator():
        changed = []
        if not (m.mobile or "").strip():
            m.mobile = "0000000000"
            changed.append("mobile")
        if m.dob is None:
            m.dob = date(2000, 1, 1)
            changed.append("dob")
        if not m.gender:
            m.gender = "m"
            changed.append("gender")
        if changed:
            m.save(update_fields=changed)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0004_member_user_onetoone"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(forwards_fill_and_prune, reverse_noop),
        migrations.AlterField(
            model_name="member",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="member_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="member",
            name="dob",
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name="member",
            name="gender",
            field=models.CharField(choices=[("m", "Male"), ("f", "Female")], max_length=1),
        ),
        migrations.AlterField(
            model_name="member",
            name="mobile",
            field=models.CharField(max_length=20),
        ),
    ]
