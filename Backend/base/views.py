from datetime import timedelta

import jwt
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.serializers import LoginSerializer
from base.utils import generate_random_mfa_code, generate_totp_qr_code

from .models import User
from .serializers import UserRegistrationSerializer

User = get_user_model()


@api_view(["POST"])
def user_api(request):
    """
    POST Methods
    """
    action = request.data.get("action")

    if action == "register":
        return register(request)
    elif action == "login":
        return login(request)
    else:
        return Response(
            {"message": "Invalid action"}, status = status.HTTP_400_BAD_REQUEST
        )


def register(request):
    """
    Register user
    """
    serializer = UserRegistrationSerializer(data = request.data)

    if serializer.is_valid():
        name = serializer.validated_data["name"]
        username = serializer.validated_data["username"]
        role = serializer.validated_data["role"]
        password = serializer.validated_data["password"]

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already taken!"}, status = status.HTTP_400_BAD_REQUEST
            )

        hashed_password = make_password(password)

        user = User.objects.create(
            username = username,
            first_name = name,
            last_name = role,  # update table
            password = hashed_password,
        )

        payload = {
            "id": user.id,
            "username": user.username,
            "exp": timezone.now() + timedelta(hours = 1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm = "HS256")

        return Response(
            {"message": "User registered successfully!", "access_token": token},
            status = status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)


def login(request):
    """
    Login user
    """
    serializer = LoginSerializer(data = request.data)

    if serializer.is_valid():
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(request, username = username, password = password)

        if user is not None:
            if user.mfa_type == "SMS":
                mfa_code = generate_random_mfa_code()
                return Response(
                    {"message": "MFA code sent via SMS. Please enter the code."},
                    status = status.HTTP_200_OK,
                )

            elif user.mfa_type == "TOTP":
                totp_key = user.totp_key
                qr_code_url = generate_totp_qr_code(totp_key)
                return Response(
                    {
                        "message": "Scan the QR code with Google Authenticator.",
                        "qr_code_url": qr_code_url,
                    },
                    status = status.HTTP_200_OK,
                )

            payload = {
                "id": user.id,
                "email": user.username,
                "exp": timezone.now() + timedelta(hours = 1),
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm = "HS256")

            return Response(
                {"message": "Login successful!", "access_token": token},
                status = status.HTTP_200_OK,
            )

        return Response(
            {"error": "Invalid credentials!"}, status = status.HTTP_400_BAD_REQUEST
        )

    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
