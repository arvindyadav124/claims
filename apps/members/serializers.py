from rest_framework import serializers

from apps.members import services
from apps.members.models import Member


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "first_name", "last_name", "email", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        return services.member_create(**validated_data)
