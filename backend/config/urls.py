from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.auth_app.urls")),
    path("api/members/", include("apps.members.urls")),
    path("api/policies/", include("apps.policies.urls")),
    path("api/claims/", include("apps.claims.urls")),
    path("api/member-policies/", include("apps.member_policies.urls")),
]
