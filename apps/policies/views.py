from rest_framework import mixins, viewsets

from apps.policies import services
from apps.policies.models import Policy
from apps.policies.serializers import PolicySerializer


class PolicyViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = PolicySerializer

    def get_queryset(self):
        member_id = self.request.query_params.get("member_id")
        if member_id:
            return services.policies_for_member(member_id=int(member_id))
        return Policy.objects.select_related("member").all().order_by("policy_number")
