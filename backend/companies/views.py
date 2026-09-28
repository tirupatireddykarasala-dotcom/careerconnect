"""
companies/views.py

WHY get_queryset() IS OVERRIDDEN: for list/retrieve, anyone (job seeker or
recruiter) should see all companies — that's needed so job seekers can browse
"who's hiring". But create/update/delete must be recruiter-only, and a
recruiter should only be able to edit their OWN company, enforced by
IsOwnerOrReadOnly at the object level.
"""
from rest_framework import generics, permissions
from .models import Company
from .serializers import CompanySerializer
from accounts.permissions import IsRecruiter, IsOwnerOrReadOnly, IsAdminRole


class CompanyListCreateView(generics.ListCreateAPIView):
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer
    filterset_fields = ['location']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsRecruiter()]
        return [permissions.IsAuthenticated()]


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


class AdminCompanyDeleteView(generics.DestroyAPIView):
    """DELETE /api/companies/admin/<id>/ — admin can remove any company (and its jobs cascade)."""
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
