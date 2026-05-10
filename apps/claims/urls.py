from rest_framework.routers import DefaultRouter

from apps.claims.views import ClaimLineItemViewSet, ClaimViewSet

router = DefaultRouter(trailing_slash=False)
router.register("line-items", ClaimLineItemViewSet, basename="claim-line-item")
router.register("", ClaimViewSet, basename="claim")

urlpatterns = router.urls
