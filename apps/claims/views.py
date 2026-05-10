from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.claims import services
from apps.claims.models import ClaimLineItem, Dispute
from apps.claims.serializers import (
    ClaimLineItemSerializer,
    ClaimLineItemTransitionSerializer,
    ClaimSerializer,
    ClaimTransitionSerializer,
    DisputeSerializer,
    DisputeTransitionSerializer,
)


class DisputeViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        claim_id = self.request.query_params.get("claim_id")
        if claim_id:
            return services.disputes_for_claim(claim_id=int(claim_id))
        return Dispute.objects.select_related("claim", "checked_by", "created_by", "updated_by").all().order_by(
            "-created_at"
        )

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        dispute = self.get_object()
        ser = DisputeTransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        checked_by = ser.validated_data.get("checked_by")
        updated = services.dispute_transition(
            dispute_id=dispute.pk,
            to_status=ser.validated_data["status"],
            checked_by_id=checked_by.pk if checked_by else None,
            updated_by_id=request.user.pk,
        )
        return Response(DisputeSerializer(updated).data, status=status.HTTP_200_OK)


class ClaimLineItemViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ClaimLineItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        claim_id = self.request.query_params.get("claim_id")
        if claim_id:
            return services.claim_line_items_for_claim(claim_id=int(claim_id))
        return ClaimLineItem.objects.select_related("claim", "checked_by").all().order_by("claim_id", "id")

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        item = self.get_object()
        ser = ClaimLineItemTransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        checked_by = ser.validated_data.get("checked_by")
        updated = services.claim_line_item_transition(
            line_item_id=item.pk,
            to_status=ser.validated_data["status"],
            checked_by_id=checked_by.pk if checked_by else None,
            actor_id=request.user.pk,
        )
        return Response(ClaimLineItemSerializer(updated).data, status=status.HTTP_200_OK)


class ClaimViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        policy_id = self.request.query_params.get("policy_id")
        if policy_id:
            return services.claims_for_policy(policy_id=int(policy_id))
        return services.claim_list()

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        claim = self.get_object()
        ser = ClaimTransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        checked_by = ser.validated_data.get("checked_by")
        updated = services.claim_transition(
            claim_id=claim.pk,
            to_status=ser.validated_data["status"],
            checked_by_id=checked_by.pk if checked_by else None,
            updated_by_id=request.user.pk,
        )
        return Response(ClaimSerializer(updated).data, status=status.HTTP_200_OK)
