from rest_framework.routers import DefaultRouter

from apps.policies.views import PolicyViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", PolicyViewSet, basename="policy")

urlpatterns = router.urls
