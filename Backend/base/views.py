from datetime import timedelta
import os
import re

import uuid
import json
from django.http import FileResponse
import jwt

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core import serializers
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.serializers import LoginSerializer
from base.utils import generate_random_mfa_code, upload_to_nextcloud

from .models import User, File
from .serializers import UserRegistrationSerializer, FileUploadSerializer

User = get_user_model()
NEXTCLOUD_BASE_URL = "https://oto.lv.tab.digital"
mfa_codes = {}

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
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        userData = json.loads(serializers.serialize('json', [user]))[0]['fields']
        del userData['password']
        resp = Response({
                "message": "User registered successfully!",
                "user_info": userData
                }, status=status.HTTP_200_OK,
            )
        resp['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        resp['Access-Control-Allow-Credentials'] = 'true'
        resp.set_cookie('jwtToken', token, httponly=True, secure=True, samesite='None', path='/')
        return resp

    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)


def login(request):
    """
    Login user
    """
    serializer = LoginSerializer(data = request.data)

    if serializer.is_valid():
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        code = "code" in request.data and request.data["code"]
        user = User.objects.get(email=email)

        if code:
            if ((email in mfa_codes) and (int(code) == mfa_codes[email])):
                payload = {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "exp": timezone.now() + timedelta(hours = 1),
                }
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
                userData = json.loads(serializers.serialize('json', [user]))[0]['fields']
                del userData['password']
                resp = Response({
                    "message": "Login successful!",
                    "user_info": userData
                    },
                    status=status.HTTP_200_OK,
                )
                resp['Access-Control-Allow-Origin'] = 'http://localhost:3000'
                resp['Access-Control-Allow-Credentials'] = 'true'
                resp.set_cookie('jwtToken', token, httponly=True, secure=True, samesite='None', path='/')
                return resp
            else:
                return Response({"error": "Invalid code"}, status = status.HTTP_400_BAD_REQUEST)

        valid = check_password(password, user.password)

        if valid:
                # if user.mfa_type == "SMS":
                #     mfa_code = generate_random_mfa_code()
                #     return Response(
                #         {"message": "MFA code sent via SMS. Please enter the code."},
                #         status = status.HTTP_200_OK,
                #     )

                # elif user.mfa_type == "TOTP":
                #     totp_key = user.totp_key
                #     qr_code_url = generate_totp_qr_code(totp_key)
                #     return Response(
                #         {
                #             "message": "Scan the QR code with Google Authenticator.",
                #             "qr_code_url": qr_code_url,
                #         },
                #         status = status.HTTP_200_OK,
                #     )
            mfa_codes[email] = generate_random_mfa_code()
            print(f"Hi, Please use this code to log in {mfa_codes[email]}")
            # send_mail(
            #     subject='Subject Here',
            #     message=f"Hi, Please use this code to log in {mfa_codes[email]}",
            #     from_email='sharkhive@secure.com',
            #     recipient_list=['user@client.com'],
            #     fail_silently=False,
            # )
            resp = Response({"success": "A code has been sent to your email"}, status = status.HTTP_200_OK)
            resp['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            resp['Access-Control-Allow-Credentials'] = 'true'
            return resp
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
    token = request.COOKIES.get('jwtToken')[2:-1] or request.COOKIES.get('jwt')
    if not token:
        return Response({"error": "Authorization token missing!"}, status=status.HTTP_400_BAD_REQUEST)

    if token.startswith("Bearer "):
        token = token[7:]

    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        role = decoded_token.get('role')
    except jwt.ExpiredSignatureError:
        return Response({"error": "Token has expired!"}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.DecodeError:
        return Response({"error": "Invalid token!"}, status=status.HTTP_400_BAD_REQUEST)

    if not role or role not in ['admin', 'standard']:
        return Response({"error": "Not allowed to upload files"}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = FileUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    file_data = file.read()
    file_size = file.size
    file_name = serializer.validated_data['file_name']
    file_type = serializer.validated_data['file_type']

    upload_destination = request.data.get("destination", "Sharkhive")

    try:
        if upload_destination == "NextCloud":
            file_url = upload_to_nextcloud(file_name, file_data)

            File.objects.create(
                user=User.objects.get(email=decoded_token.get('email')),
                file_name=file_name,
                file_type=file_type,
                file_url=file_url,
                file_size=file_size
            )
            return Response({
                "message": "File uploaded to NextCloud successfully",
                "file_url": file_url
            }, status=status.HTTP_201_CREATED)

        elif upload_destination == "Sharkhive":
            # Save the encrypted file to the backend file system
            save_path = os.path.join(settings.MEDIA_ROOT, "uploads", file_name)
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, "wb") as f:
                f.write(file_data)

            File.objects.create(
                user=User.objects.get(email=decoded_token.get('email')),
                file_name=file_name,
                file_type=file_type,
                file_url=save_path,
                file_size=file_size
            )
            return Response({
                "message": "File uploaded to Sharkhive successfully",
                "file_url": save_path
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "Invalid upload destination"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_files(request):
    """
    List of all the files and their metadata for a particular user
    """
    token = request.COOKIES.get('jwtToken')[2:-1] or request.COOKIES.get('jwt')

    if not token:
        return Response({"error": "Authorization token missing!"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if token.startswith("Bearer "):
            token = token[7:]

        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email = decoded_token.get('email')

        if not email:
            return Response({"error": "Invalid token!"}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(get_user_model(), email=email)
        files = File.objects.filter(user=user)

        file_data = [
            {
                'file_name': file.file_name,
                'file_type': file.file_type,
                'file_size': file.file_size,
                'upload_date': file.upload_date,
                'file_url': (
                    file.file_url
                    if file.file_url.startswith(NEXTCLOUD_BASE_URL)
                    else f"http://localhost:8000/api/download/{file.file_name}"
                ),
                'next_cloud': file.file_url.startswith(NEXTCLOUD_BASE_URL)
            }
            for file in files
        ]

        return Response(file_data, status=status.HTTP_200_OK)

    except jwt.ExpiredSignatureError:
        return Response({"error": "Token has expired!"}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.DecodeError:
        return Response({"error": "Invalid token!"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def download_file(request, file_name):
    """
    Download file stored in server fs
    """
    try:
        token = request.COOKIES.get('jwtToken')[2:-1] or request.COOKIES.get('jwt')

        if not token:
            return Response({"error": "Authorization token missing!"}, status=status.HTTP_400_BAD_REQUEST)

        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = User.objects.get(id=decoded_token.get('id'))

        file_obj = File.objects.get(file_name=file_name, user=user)

        if file_obj.file_url.startswith(NEXTCLOUD_BASE_URL):
            return Response(status=status.HTTP_204_NO_CONTENT)

        file_path = os.path.join(settings.MEDIA_ROOT, "uploads", file_obj.file_name)

        if not os.path.exists(file_path) or file_obj is None:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=file_obj.file_name)
        return response
        
    except jwt.ExpiredSignatureError:
            return Response({"error": "Token has expired!"}, status=status.HTTP_401_UNAUTHORIZED)
