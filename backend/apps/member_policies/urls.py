from rest_framework.routers import DefaultRouter

from apps.member_policies.views import MemberPolicyViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", MemberPolicyViewSet, basename="member-policy")

urlpatterns = router.urls
