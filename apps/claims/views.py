from rest_framework import mixins, viewsets

from apps.claims import services
from apps.claims.models import Claim, ClaimLineItem, Dispute
from apps.claims.serializers import ClaimLineItemSerializer, ClaimSerializer, DisputeSerializer


class DisputeViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = DisputeSerializer

    def get_queryset(self):
        claim_id = self.request.query_params.get("claim_id")
        if claim_id:
            return services.disputes_for_claim(claim_id=int(claim_id))
        return Dispute.objects.select_related("claim", "checked_by", "created_by", "updated_by").all().order_by(
            "-created_at"
        )


class ClaimLineItemViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ClaimLineItemSerializer

    def get_queryset(self):
        claim_id = self.request.query_params.get("claim_id")
        if claim_id:
            return services.claim_line_items_for_claim(claim_id=int(claim_id))
        return ClaimLineItem.objects.select_related("claim", "checked_by").all().order_by("claim_id", "id")


class ClaimViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ClaimSerializer

    def get_queryset(self):
        policy_id = self.request.query_params.get("policy_id")
        if policy_id:
            return services.claims_for_policy(policy_id=int(policy_id))
        return Claim.objects.select_related("policy", "checked_by").all().order_by("claim_number")
