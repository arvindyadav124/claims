from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from apps.claims import services
from apps.claims.models import Claim, ClaimLineItem, Dispute
from apps.member_policies.models import MemberPolicy
from apps.members.models import Member


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

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return attrs
        policy = attrs.get("policy")
        if policy is None:
            return attrs
        user = request.user
        today = timezone.now().date()
        try:
            member = Member.objects.get(user_id=user.pk)
        except Member.DoesNotExist:
            raise serializers.ValidationError(
                {"policy": "A member profile is required to create a claim."}
            )
        if not MemberPolicy.objects.filter(
            member=member,
            policy_id=policy.pk,
            purchasing_date__lte=today,
            valid_up_to__gte=today,
        ).exists():
            raise serializers.ValidationError(
                {
                    "policy": (
                        "You can only create claims for policies you have purchased "
                        "with a current enrollment (valid from purchase date through valid-up-to)."
                    )
                }
            )
        return attrs

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
    claim_number = serializers.CharField(source="claim.claim_number", read_only=True)

    class Meta:
        model = Dispute
        fields = [
            "id",
            "claim",
            "claim_number",
            "reason",
            "status",
            "checked_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "claim_number",
            "status",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        return services.dispute_create(created_by=user, updated_by=user, **validated_data)


class DisputeTransitionSerializer(serializers.Serializer):
    status = serializers.IntegerField()
    checked_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
