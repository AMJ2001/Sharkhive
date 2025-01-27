from datetime import timedelta
import re

import jwt
import json
import uuid
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
from base.utils import encrypt_file, generate_random_mfa_code, generate_totp_qr_code, upload_to_nextcloud

from .models import User, File
from .serializers import UserRegistrationSerializer, FileUploadSerializer

User = get_user_model()
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
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        code = "code" in request.data and request.data["code"]
        user = User.objects.get(email=email)

        if code:
            if ((email in mfa_codes) and (int(code) == mfa_codes[email])):
                payload = {
                    "id": user.id,
                    "email": user.email,
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
    token = request.headers.get('Authorization')
    if not token:
        return Response({"error": "Authorization token missing!"}, status=status.HTTP_400_BAD_REQUEST)

    if token.startswith("Bearer "):
        token = token[7:]

    decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    role = "role" in decoded_token and decoded_token.get('role')

    if ((not role) or (role is not 'admin')):
        return Response({"error": "Not allowed to upload files"}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = FileUploadSerializer(data=request.data)

    if serializer.is_valid():
        file = request.FILES['file']
        file_data = file.read()
        file_size = file.size
        file_name = serializer.validated_data['file_name']
        file_type = serializer.validated_data['file_type']

        # Encrypt the file
        encrypted_file_data = encrypt_file(file_data)

        try:
            # Upload the encrypted file to Nextcloud
            file_url = upload_to_nextcloud(file_name, encrypted_file_data)

            File.objects.create(
                user=User.objects.get(email='john.doe@example.com'),
                file_name=file_name,
                file_type=file_type,
                file_url=file_url,
                file_size=file_size
            )

            return Response({
                "message": "File uploaded successfully",
                "file_url": file_url
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_user_files(request):
    """
    List of all the files and their metadata for a particular user
    """
    token = request.COOKIES.get('jwtToken')[2:-1]

    if not token:
        return Response({"error": "Authorization token missing!"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Remove 'Bearer ' part if it's there in the token
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
                'file_url': file.file_url
            }
            for file in files
        ]

        return Response(file_data, status=status.HTTP_200_OK)

    except jwt.ExpiredSignatureError:
        return Response({"error": "Token has expired!"}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.DecodeError:
        return Response({"error": "Invalid token!"}, status=status.HTTP_400_BAD_REQUEST)