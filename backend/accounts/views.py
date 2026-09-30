"""
accounts/views.py

WHY CLASS-BASED GENERIC VIEWS: DRF's generics (CreateAPIView,
RetrieveUpdateAPIView, ...) already implement the boring, error-prone parts
of a CRUD endpoint (parsing input, calling the serializer, returning the
right status code). Writing views by hand from APIView would just re-invent
that logic with more room for bugs.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import JobSeekerProfile, RecruiterProfile
from .serializers import (
    RegisterSerializer, CustomTokenObtainPairSerializer,
    JobSeekerProfileSerializer, RecruiterProfileSerializer, UserAdminSerializer,
)
from .permissions import IsAdminRole

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/  — open to anyone (no auth required)."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns {access, refresh, role, username, user_id}."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

class MyJobSeekerProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/auth/profile/jobseeker/
    Always operates on the LOGGED-IN user's own profile — there is no id in
    the URL, which makes it impossible for a user to accidentally (or
    deliberately) edit someone else's profile.
    """
    serializer_class = JobSeekerProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        return profile


class MyRecruiterProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /api/auth/profile/recruiter/ — same pattern as above."""
    serializer_class = RecruiterProfileSerializer

    def get_object(self):
        profile, _ = RecruiterProfile.objects.get_or_create(user=self.request.user)
        return profile


class MeView(APIView):
    """GET /api/auth/me/ — quick 'who am I' check used by the React AuthContext on page refresh."""
    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
        })



class AdminUserListView(generics.ListAPIView):
    """GET /api/auth/admin/users/?role=recruiter"""
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ['role', 'is_active_account']
    queryset = User.objects.all().order_by('-date_joined')

class BootstrapAdminView(APIView):
    """One-time admin creation over HTTP, for hosts with no shell access."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import os
        expected_key = os.environ.get('BOOTSTRAP_ADMIN_KEY')
        if not expected_key:
            return Response({'error': 'BOOTSTRAP_ADMIN_KEY is not set on the server.'}, status=status.HTTP_403_FORBIDDEN)
        if request.GET.get('key') != expected_key:
            return Response({'error': 'Invalid key.'}, status=status.HTTP_403_FORBIDDEN)
        if User.objects.filter(role=User.Role.ADMIN).exists():
            return Response({'error': 'An admin account already exists. This endpoint only works once.'}, status=status.HTTP_400_BAD_REQUEST)

        username = request.GET.get('username')
        email = request.GET.get('email')
        password = request.GET.get('password')
        if not (username and email and password):
            return Response({'error': 'username, email and password are all required.'}, status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_superuser(username=username, email=email, password=password, role=User.Role.ADMIN)
        return Response({'message': f"Admin user '{username}' created. You can now log in."})
    


class AdminDashboardStatsView(APIView):
    """
    GET /api/auth/admin/dashboard/
    WHY ONE ENDPOINT FOR ALL COUNTS: the admin dashboard needs totals from
    four different apps (users, companies, jobs, applications). Rather than
    the React dashboard firing four separate requests and assembling the
    numbers client-side, one aggregating endpoint keeps that logic server-side
    and makes the page load in a single round trip.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        from companies.models import Company
        from jobs.models import Job
        from applications.models import Application

        return Response({
            'total_job_seekers': User.objects.filter(role=User.Role.JOB_SEEKER).count(),
            'total_recruiters': User.objects.filter(role=User.Role.RECRUITER).count(),
            'total_companies': Company.objects.count(),
            'total_jobs': Job.objects.count(),
            'active_jobs': Job.objects.filter(is_active=True).count(),
            'total_applications': Application.objects.count(),
            'applications_by_status': {
                choice_value: Application.objects.filter(status=choice_value).count()
                for choice_value, _ in Application.Status.choices
            },
        })


class AdminUserToggleActiveView(APIView):
    """PATCH /api/auth/admin/users/<id>/toggle-active/ — suspend/reinstate a user."""
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active_account = not user.is_active_account
        user.save(update_fields=['is_active_account'])
        return Response({'id': user.id, 'is_active_account': user.is_active_account})
