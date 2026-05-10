from django.contrib import admin

from apps.policies.models import Policy


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ("policy_number", "member", "status", "effective_date")
    list_filter = ("status",)
    search_fields = ("policy_number", "member__email")
