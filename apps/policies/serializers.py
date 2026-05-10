from rest_framework import serializers

from apps.policies import services
from apps.policies.models import Policy


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ["id", "member", "policy_number", "status", "effective_date"]
        read_only_fields = ["id", "status"]

    def create(self, validated_data):
        return services.policy_create(
            member=validated_data["member"],
            policy_number=validated_data["policy_number"],
            effective_date=validated_data["effective_date"],
        )
