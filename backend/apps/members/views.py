from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.members import services
from apps.members.serializers import MemberSerializer


class MemberViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return services.member_list()

    def perform_destroy(self, instance):
        services.member_delete(instance=instance)
