from django.urls import path
from .views import user_api, verify_email

urlpatterns = [
    path('api/register/', user_api, name = 'user_api'),
    path('api/login/', user_api, name = 'user_api'),
    path('api/verify-email/', verify_email, name = 'verify_email'),
]