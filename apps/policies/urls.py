from rest_framework.routers import DefaultRouter

from apps.policies.views import PolicyItemViewSet, PolicyViewSet

router = DefaultRouter(trailing_slash=False)
# Register `items` before the catch-all `""` policy routes so `/items` is not treated as `pk="items"`.
router.register("items", PolicyItemViewSet, basename="policy-item")
router.register("", PolicyViewSet, basename="policy")

urlpatterns = router.urls
