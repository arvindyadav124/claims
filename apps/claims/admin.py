from django.contrib import admin

from apps.claims.models import Claim, ClaimLineItem


class ClaimLineItemInline(admin.TabularInline):
    model = ClaimLineItem
    extra = 0


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("claim_number", "policy", "amount_cents", "status", "checked_by", "created_at")
    list_filter = ("status",)
    search_fields = ("claim_number", "policy__name")
    inlines = [ClaimLineItemInline]


@admin.register(ClaimLineItem)
class ClaimLineItemAdmin(admin.ModelAdmin):
    list_display = ("diagnosis_code", "claim", "amount", "status", "checked_by")
    list_filter = ("status",)
    search_fields = ("diagnosis_code", "claim__claim_number")
