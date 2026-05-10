from django.contrib import admin

from apps.claims.models import Claim, ClaimLineItem, Dispute


class ClaimLineItemInline(admin.TabularInline):
    model = ClaimLineItem
    extra = 0


class DisputeInline(admin.TabularInline):
    model = Dispute
    extra = 0
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("claim_number", "policy", "amount_cents", "status", "checked_by", "created_at")
    list_filter = ("status",)
    search_fields = ("claim_number", "policy__name")
    inlines = [ClaimLineItemInline, DisputeInline]


@admin.register(ClaimLineItem)
class ClaimLineItemAdmin(admin.ModelAdmin):
    list_display = ("diagnosis_code", "claim", "amount", "status", "checked_by")
    list_filter = ("status",)
    search_fields = ("diagnosis_code", "claim__claim_number")


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("id", "claim", "status", "checked_by", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("reason", "claim__claim_number")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
