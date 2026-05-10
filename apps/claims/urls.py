from rest_framework.routers import DefaultRouter

from apps.claims.views import ClaimViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", ClaimViewSet, basename="claim")

urlpatterns = router.urls
