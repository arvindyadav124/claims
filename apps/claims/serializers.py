from rest_framework import serializers

from apps.claims import services
from apps.claims.models import Claim, ClaimLineItem


class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = [
            "id",
            "policy",
            "claim_number",
            "amount_cents",
            "status",
            "checked_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "checked_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        return services.claim_submit(
            policy=validated_data["policy"],
            claim_number=validated_data["claim_number"],
            amount_cents=validated_data["amount_cents"],
        )


class ClaimLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimLineItem
        fields = [
            "id",
            "claim",
            "diagnosis_code",
            "amount",
            "status",
            "checked_by",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return services.claim_line_item_create(**validated_data)
