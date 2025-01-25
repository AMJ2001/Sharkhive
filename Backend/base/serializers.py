from rest_framework import serializers

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)

class UserRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    username = serializers.CharField(required=True)
    role = serializers.CharField(required=True)
    password = serializers.CharField(required=True)  # Password will be hashed in the view