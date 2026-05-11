from django.contrib import admin

from apps.policies.models import Policy, PolicyItem


class PolicyItemInline(admin.TabularInline):
    model = PolicyItem
    extra = 0
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "price",
        "total_cover",
        "min_age",
        "max_age",
        "eligible_gender",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "eligible_gender")
    search_fields = ("name",)
    inlines = [PolicyItemInline]


@admin.register(PolicyItem)
class PolicyItemAdmin(admin.ModelAdmin):
    list_display = (
        "diagnosis_code",
        "policy",
        "max_percent_of_policy",
        "max_yearly_limit",
        "max_claims_per_year",
        "created_at",
        "updated_at",
    )
    list_filter = ("policy",)
    search_fields = ("diagnosis_code", "policy__name")
