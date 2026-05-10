from rest_framework import mixins, viewsets

from apps.members import services
from apps.members.serializers import MemberSerializer


class MemberViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = MemberSerializer

    def get_queryset(self):
        return services.member_list()
