import pyotp
import random
# from twilio.rest import Client
import qrcode

def generate_totp_qr_code(totp_key):
    totp = pyotp.TOTP(totp_key)
    qr_code_url = totp.provisioning_uri(name="YourAppName", issuer_name="YourCompany")
    img = qrcode.make(qr_code_url)
    img.save('totp_qr_code.png')
    return qr_code_url

def generate_random_mfa_code():
    return str(random.randint(100000, 999999))

# def send_sms(phone_number, mfa_code):
#     client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
#     message = client.messages.create(
#         body=f"Your MFA code is {mfa_code}",
#         from_=TWILIO_PHONE_NUMBER,
#         to=phone_number
#     )

def verify_sms_mfa_code(user, entered_code):
    if user.mfa_code == entered_code:
        return True #jwt can be generated now
    return False

def verify_totp_mfa_code(user, entered_code):
    totp = pyotp.TOTP(user.totp_key)
    if totp.verify(entered_code):
       return True #jwt can be generated now
    return False