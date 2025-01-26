from rest_framework import serializers

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)

class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.CharField(required = True)
    username = serializers.CharField(required = True)
    role = serializers.CharField(required = True)
    password = serializers.CharField(required = True)  # Password will be hashed in the view
    mfa_type = serializers.CharField(required = False)

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    file_name = serializers.CharField(max_length=255)
    file_type = serializers.CharField(max_length=50)      