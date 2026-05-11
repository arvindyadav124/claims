from rest_framework import serializers

from apps.policies import services
from apps.policies.models import Policy, PolicyItem


class PolicyItemNestedSerializer(serializers.ModelSerializer):
    """Policy item embedded under a policy (parent policy is implied)."""

    class Meta:
        model = PolicyItem
        fields = [
            "id",
            "diagnosis_code",
            "max_percent_of_policy",
            "max_yearly_limit",
            "max_claims_per_year",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PolicySerializer(serializers.ModelSerializer):
    items = PolicyItemNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Policy
        fields = [
            "id",
            "name",
            "price",
            "min_age",
            "max_age",
            "eligible_gender",
            "total_cover",
            "status",
            "items",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_by", "updated_by", "created_at", "updated_at"]
        extra_kwargs = {
            "total_cover": {"required": True, "min_value": 1},
        }

    def create(self, validated_data):
        user = self.context["request"].user
        return services.policy_create(
            name=validated_data["name"],
            price=validated_data["price"],
            min_age=validated_data["min_age"],
            max_age=validated_data["max_age"],
            eligible_gender=validated_data["eligible_gender"],
            total_cover=validated_data["total_cover"],
            created_by=user,
            updated_by=user,
        )


class PolicyItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyItem
        fields = [
            "id",
            "policy",
            "diagnosis_code",
            "max_percent_of_policy",
            "max_yearly_limit",
            "max_claims_per_year",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return services.policy_item_create(
            policy=validated_data["policy"],
            diagnosis_code=validated_data["diagnosis_code"],
            max_percent_of_policy=validated_data["max_percent_of_policy"],
            max_yearly_limit=validated_data["max_yearly_limit"],
            max_claims_per_year=validated_data["max_claims_per_year"],
            created_by=user,
            updated_by=user,
        )
