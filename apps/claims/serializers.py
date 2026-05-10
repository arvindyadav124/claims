from rest_framework import serializers

from apps.claims import services
from apps.claims.models import Claim


class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ["id", "policy", "claim_number", "amount_cents", "status", "filed_at"]
        read_only_fields = ["id", "status", "filed_at"]

    def create(self, validated_data):
        return services.claim_submit(
            policy=validated_data["policy"],
            claim_number=validated_data["claim_number"],
            amount_cents=validated_data["amount_cents"],
        )
