from datetime import timedelta
import re

import jwt
import uuid
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.serializers import LoginSerializer
from base.utils import encrypt_file, generate_random_mfa_code, generate_totp_qr_code, upload_to_nextcloud

from .models import User, File
from .serializers import UserRegistrationSerializer, FileUploadSerializer

User = get_user_model()

@api_view(["POST"])
def user_api(request):
    """
    POST Methods
    """
    action = request.data.get("action")

    if action == "reg":
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
        email = serializer.validated_data["email"]
        username = serializer.validated_data["username"]
        role = serializer.validated_data["role"]
        password = serializer.validated_data["password"]
        mfa_type = serializer.validated_data["mfa_type"]

        hashed_password = make_password(password)

        user = User.objects.create(
            id = uuid.uuid4().hex[:6],
            username = username,
            email = email,
            password = hashed_password,
            role = role,
            mfa_type = mfa_type
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

@api_view(["GET"])
def verify_email(request):
    """
    Verify if the email already exists.
    """
    email = request.query_params.get('email')

    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return Response(
            {"error": "Correct username parameter is required."},
            status = status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email = email).exists():
        return Response(
            {"error": "Email ID already taken."},
            status = status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {"message": "available"},
        status = status.HTTP_200_OK
    )

@api_view(['POST'])
def upload_file(request):
    """
    Endpoint to upload an encrypted file to Nextcloud
    """
    serializer = FileUploadSerializer(data=request.data)

    if serializer.is_valid():
        file = request.FILES['file']
        file_data = file.read()
        file_name = serializer.validated_data['file_name']
        file_type = serializer.validated_data['file_type']

        # Encrypt the file
        encrypted_file_data = encrypt_file(file_data)

        try:
            # Upload the encrypted file to Nextcloud
            file_url = upload_to_nextcloud(file_name, encrypted_file_data)

            # Save file metadata in the database
            new_file = File.objects.create(
                user=request.user,
                name=file_name,
                file_type=file_type,
                file_url=file_url
            )

            return Response({
                "message": "File uploaded successfully",
                "file_url": file_url
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    return Response(serializer.errors, status=400)