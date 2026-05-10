from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.members import services
from apps.members.models import Member

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    """Create requires user, name, mobile, dob, gender; email is taken from the user's account."""

    class Meta:
        model = Member
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "user",
            "dob",
            "gender",
            "mobile",
            "address",
            "distt",
            "state",
            "pincode",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "created_by", "updated_by", "created_at", "updated_at"]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "mobile": {"required": True},
            "user": {"required": True},
            "dob": {"required": True},
            "gender": {"required": True},
        }

    def validate(self, attrs: dict) -> dict:
        if self.instance is not None:
            return attrs

        user = attrs.get("user")
        if user is None:
            raise serializers.ValidationError({"user": ["This field is required."]})

        if Member.objects.filter(user_id=user.pk).exists():
            raise serializers.ValidationError(
                {"user": ["A member profile already exists for this user."]}
            )

        return attrs

    def create(self, validated_data: dict):
        user = validated_data["user"]
        validated_data["email"] = User.objects.normalize_email(user.email)
        return services.member_create(**validated_data)
