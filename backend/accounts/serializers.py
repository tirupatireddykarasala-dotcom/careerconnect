"""
accounts/serializers.py

WHY SERIALIZERS: a serializer is the translator between Python/Django model
objects and the JSON that travels over HTTP. Register/login/profile each
need a different "shape" of JSON, so each gets its own serializer instead of
one giant one.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import JobSeekerProfile, RecruiterProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles sign-up for BOTH job seekers and recruiters — the `role` field
    picked on the React registration form decides which profile row gets
    created automatically (see .create() below).
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 'role', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': "Passwords don't match."})
        if attrs['role'] == User.Role.ADMIN:
            raise serializers.ValidationError({'role': 'Admin accounts cannot self-register.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            phone=validated_data.get('phone', ''),
        )
        # Auto-create the matching empty profile so the frontend can always
        # assume `jobseeker_profile` / `recruiter_profile` exists.
        if user.role == User.Role.JOB_SEEKER:
            JobSeekerProfile.objects.create(user=user, full_name=user.username)
        elif user.role == User.Role.RECRUITER:
            RecruiterProfile.objects.create(user=user)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login serializer to embed the user's role and id
    directly inside the token response, so React knows immediately after
    login which dashboard to route to, without a second API call.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['username'] = self.user.username
        data['role'] = self.user.role
        return data


class JobSeekerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = JobSeekerProfile
        fields = ['id', 'username', 'email', 'full_name', 'bio', 'skills',
                   'location', 'resume', 'experience_years', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class RecruiterProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = RecruiterProfile
        fields = ['id', 'username', 'email', 'designation']


class UserAdminSerializer(serializers.ModelSerializer):
    """Used only by the Admin > Manage Users screen."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active_account', 'date_joined']
