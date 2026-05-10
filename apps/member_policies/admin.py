from django.contrib import admin

from apps.member_policies.models import MemberPolicy


@admin.register(MemberPolicy)
class MemberPolicyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "member",
        "policy",
        "purchasing_date",
        "price",
        "valid_up_to",
        "created_at",
        "updated_at",
    )
    list_filter = ("purchasing_date", "valid_up_to")
    search_fields = ("member__email", "policy__name")
    raw_id_fields = ("member", "policy", "created_by", "updated_by")
