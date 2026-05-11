from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.policies import services
from apps.policies.models import PolicyItem
from apps.policies.serializers import PolicyItemSerializer, PolicySerializer


class PolicyViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.policy_list()

    def perform_destroy(self, instance):
        services.policy_delete(instance=instance)


class PolicyItemViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = PolicyItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        policy_id = self.request.query_params.get("policy_id")
        if policy_id:
            return services.policy_items_for_policy(policy_id=int(policy_id))
        return PolicyItem.objects.select_related("policy").all().order_by("policy_id", "diagnosis_code")
