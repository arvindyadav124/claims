from django.contrib import admin

from apps.claims.models import Claim


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("claim_number", "policy", "amount_cents", "status", "filed_at")
    list_filter = ("status",)
    search_fields = ("claim_number", "policy__policy_number")
