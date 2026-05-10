from rest_framework import mixins, viewsets

from apps.claims import services
from apps.claims.models import Claim
from apps.claims.serializers import ClaimSerializer


class ClaimViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ClaimSerializer

    def get_queryset(self):
        policy_id = self.request.query_params.get("policy_id")
        if policy_id:
            return services.claims_for_policy(policy_id=int(policy_id))
        return Claim.objects.select_related("policy", "policy__member").all().order_by("claim_number")
