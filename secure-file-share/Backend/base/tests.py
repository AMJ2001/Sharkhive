from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

class UserApiTests(TestCase):
    """
    Tests for APIs
    """
    def setUp(self):
        """
        Test setup
        """
        self.client = APIClient()
        self.user_data = {
            "email": "testuser@example.com",
            "username": "testuser",
            "password": "password123",
            "role": "user",
            "mfa_type": "SMS",
        }
        self.user = User.objects.create_user(**self.user_data)
        self.login_data = {
            "email": "testuser@example.com",
            "password": "password123",
        }

    def test_register_user(self):
        url = reverse('user-api')
        data = {
            "action": "reg",
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "password123",
            "role": "admin",
            "mfa_type": "SMS",
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("user_info", response.data)

    def test_register_user_invalid_data(self):
        url = reverse('user-api')
        data = {
            "action": "reg",
            "email": "invalidemail",
            "username": "newuser",
            "password": "password123",
            "role": "admin",
            "mfa_type": "SMS",
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_user(self):
        url = reverse('user-api')
        data = {
            "action": "login",
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_login_user_with_invalid_credentials(self):
        url = reverse('user-api')
        data = {
            "action": "login",
            "email": self.user_data["email"],
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch('base.utils.generate_random_mfa_code')
    def test_login_user_with_mfa(self, mock_generate_mfa_code):
        mock_generate_mfa_code.return_value = '123456'
        url = reverse('user-api')
        data = {
            "action": "login",
            "email": self.user_data["email"],
            "password": self.user_data["password"],
            "code": '123456'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_verify_email(self):
        url = reverse('verify-email')
        response = self.client.get(url, {'email': 'testuser@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_verify_email_available(self):
        url = reverse('verify-email')
        response = self.client.get(url, {'email': 'newemail@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_upload_file(self):
        url = reverse('upload-file')
        file_data = {
            "action": "upload",
            "file_name": "testfile.txt",
            "file_type": "text/plain"
        }
        file = open('testfile.txt', 'rb')
        data = {
            'file': file,
            'file_name': 'testfile.txt',
            'file_type': 'text/plain'
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertIn("file_url", response.data)

    def test_get_user_files(self):
        url = reverse('get-user-files')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_user_files_unauthorized(self):
        url = reverse('get-user-files')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch('jwt.decode')
    def test_get_user_files_with_invalid_token(self, mock_decode):
        mock_decode.side_effect = Exception('Invalid Token')
        url = reverse('get-user-files')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
