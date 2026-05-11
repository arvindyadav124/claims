from rest_framework.routers import DefaultRouter

from apps.claims.views import ClaimLineItemViewSet, ClaimViewSet, DisputeViewSet

router = DefaultRouter(trailing_slash=False)
router.register("disputes", DisputeViewSet, basename="dispute")
router.register("line-items", ClaimLineItemViewSet, basename="claim-line-item")
router.register("", ClaimViewSet, basename="claim")

urlpatterns = router.urls
