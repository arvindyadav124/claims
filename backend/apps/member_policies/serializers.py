from rest_framework import serializers

from apps.member_policies import services
from apps.member_policies.models import MemberPolicy


class MemberPolicySerializer(serializers.ModelSerializer):
    """List/detail include member/policy labels for UI; create accepts FK ids only."""

    member_user_id = serializers.IntegerField(source="member.user_id", read_only=True)
    member_display = serializers.SerializerMethodField()
    policy_name = serializers.CharField(source="policy.name", read_only=True)

    class Meta:
        model = MemberPolicy
        fields = [
            "id",
            "member",
            "member_user_id",
            "member_display",
            "policy",
            "policy_name",
            "purchasing_date",
            "price",
            "valid_up_to",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "member_user_id",
            "member_display",
            "policy_name",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "member": {"required": True},
            "policy": {"required": True},
            "purchasing_date": {"required": True},
            "price": {"required": True},
            "valid_up_to": {"required": True},
        }

    def create(self, validated_data):
        user = self.context["request"].user
        return services.member_policy_create(
            member=validated_data["member"],
            policy=validated_data["policy"],
            purchasing_date=validated_data["purchasing_date"],
            price=validated_data["price"],
            valid_up_to=validated_data["valid_up_to"],
            created_by=user,
            updated_by=user,
        )

    def update(self, instance, validated_data):
        user = self.context["request"].user
        return services.member_policy_update(instance=instance, updated_by=user, **validated_data)

    def get_member_display(self, obj: MemberPolicy) -> str:
        m = obj.member
        return f"{m.first_name} {m.last_name} — {m.email}"
