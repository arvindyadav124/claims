from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.claims import services
from apps.claims.models import Claim, ClaimLineItem, Dispute


User = get_user_model()


class ClaimLineItemNestedSerializer(serializers.ModelSerializer):
    """Line item embedded under a claim (parent claim is implied)."""

    class Meta:
        model = ClaimLineItem
        fields = [
            "id",
            "diagnosis_code",
            "amount",
            "status",
            "checked_by",
        ]
        read_only_fields = fields


class ClaimSerializer(serializers.ModelSerializer):
    line_items = ClaimLineItemNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Claim
        fields = [
            "id",
            "policy",
            "claim_number",
            "amount_cents",
            "status",
            "line_items",
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
        user = self.context["request"].user
        return services.claim_submit(
            policy=validated_data["policy"],
            claim_number=validated_data["claim_number"],
            amount_cents=validated_data["amount_cents"],
            created_by=user,
            updated_by=user,
        )


class ClaimTransitionSerializer(serializers.Serializer):
    status = serializers.IntegerField()
    checked_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
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
        read_only_fields = ["id", "status"]

    def create(self, validated_data):
        return services.claim_line_item_create(**validated_data)


class ClaimLineItemTransitionSerializer(serializers.Serializer):
    status = serializers.IntegerField()
    checked_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )


class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = [
            "id",
            "claim",
            "reason",
            "status",
            "checked_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return services.dispute_create(created_by=user, updated_by=user, **validated_data)


class DisputeTransitionSerializer(serializers.Serializer):
    status = serializers.IntegerField()
    checked_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
