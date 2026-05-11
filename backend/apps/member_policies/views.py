from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.member_policies import services
from apps.member_policies.serializers import MemberPolicySerializer


class MemberPolicyViewSet(viewsets.ModelViewSet):
    serializer_class = MemberPolicySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.query_params.get("mine") == "1":
            return services.member_policy_list(
                user_id_for_mine=self.request.user.pk,
                active_on=timezone.now().date(),
            )
        member_id = self.request.query_params.get("member_id")
        policy_id = self.request.query_params.get("policy_id")
        return services.member_policy_list(
            member_id=int(member_id) if member_id is not None else None,
            policy_id=int(policy_id) if policy_id is not None else None,
        )

    def perform_destroy(self, instance):
        services.member_policy_delete(instance=instance)
