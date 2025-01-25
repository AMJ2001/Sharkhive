from django.urls import path
from . import views

urlpatterns = [
    path('api/register/', views.RegisterAPIView.as_view(), name='register_api'),
    #path('api/login/', views.LoginAPIView.as_view(), name='login_api'),
]