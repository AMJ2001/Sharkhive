from datetime import timedelta
import random
import hashlib
import pyotp

# from twilio.rest import Client
import qrcode
import requests

from django.utils import timezone
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from secure_file_service import settings
from .models import TemporaryFileLink

def generate_totp_qr_code(totp_key):
    totp = pyotp.TOTP(totp_key)
    qr_code_url = totp.provisioning_uri(name="YourAppName", issuer_name="YourCompany")
    img = qrcode.make(qr_code_url)
    img.save('totp_qr_code.png')
    return qr_code_url

def generate_random_mfa_code():
    return random.randint(100000, 999999)

# def send_sms(phone_number, mfa_code):
#     client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
#     message = client.messages.create(
#         body=f"Your MFA code is {mfa_code}",
#         from_=TWILIO_PHONE_NUMBER,
#         to=phone_number
#     )

def verify_totp_mfa_code(user, entered_code):
    totp = pyotp.TOTP(user.totp_key)
    if totp.verify(entered_code):
        return True #jwt can be generated now
    return False

def generate_shareable_link(file, email=None, expiration_minutes=60):
    """
    Create the temporary link record
    """
    expiration_time = timezone.now() + timedelta(minutes=expiration_minutes)

    temp_link = TemporaryFileLink.objects.create(
        file=file,
        expiration_time=expiration_time,
        shared_with_email=email
    )

    shareable_link = f"http://localhost:8000/api/download/{temp_link.token}"

    return shareable_link

def upload_to_nextcloud(file_name, file_data):
    """
    Upload the file to Nextcloud via WebDAV and return the public URL
    """
    nextcloud_base_url = settings.NEXTCLOUD_BASE_URL
    username = settings.NEXTCLOUD_USERNAME
    password = settings.NEXTCLOUD_PASSWORD

    upload_path = f"/remote.php/dav/files/{username}/{file_name}"
    full_url = nextcloud_base_url + upload_path

    response = requests.put(
        full_url,
        data=file_data,
        auth=(username, password),
    )

    if response.status_code == 201:
        return full_url  # Return the Nextcloud URL
    else:
        raise Exception(f"Failed to upload to Nextcloud: {response.status_code}, {response.text}")