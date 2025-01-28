from django.urls import path
from .views import user_api, verify_email, upload_file, get_user_files, download_file

urlpatterns = [
    path('api/register/', user_api, name = 'user_api'),
    path('api/login/', user_api, name = 'user_api'),
    path('api/verify-email/', verify_email, name = 'verify_email'),
    path('api/upload/', upload_file, name = 'file_upload'),
    path('api/files/', get_user_files, name = 'user_files'),
    path('api/download/<str:file_name>/', download_file, name = 'download_file'),
]
