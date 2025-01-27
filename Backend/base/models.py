from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser):
    """
    Data of each user
    """
    id = models.CharField(max_length=50, primary_key=True, unique=True) 
    username = models.CharField(max_length=50, unique=True, null=False)
    email = models.EmailField(max_length=80, unique=True, null=False)
    password = models.CharField(max_length=255, null=False)
    role = models.CharField(max_length=20, null=False)
    mfa_type = models.CharField(max_length=20, null=False)
    last_login = models.DateTimeField(default = timezone.now)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'role', 'mfa_type']

    objects = CustomUserManager()

    def __str__(self):
        return str(self.username)

class File(models.Model):
    """
    Metadata for file
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    upload_date = models.DateTimeField(default=timezone.now)
    file_url = models.URLField()

    objects = models.Manager()

    def __str__(self):
        return str(self.file_name)

class FilePermission(models.Model):
    """
    Data for allowed actions for files
    """
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_type = models.CharField(
        max_length=20, choices=[('read', 'Read'), ('write', 'Write'), ('delete', 'Delete')]
    )

    class Meta:
        """
        Each user can have only 1 permission type per file
        """
        unique_together = ('file', 'user')

    def __str__(self):
        try:
            return f"{self.user.username} - {self.permission_type} - {self.file.file_name}"
        except AttributeError:
            return f"Permission: {self.permission_type} - File: {self.file}"    