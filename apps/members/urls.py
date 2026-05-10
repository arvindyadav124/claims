from rest_framework.routers import DefaultRouter

from apps.members.views import MemberViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", MemberViewSet, basename="member")

urlpatterns = router.urls
