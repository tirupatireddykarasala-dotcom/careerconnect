"""
accounts/permissions.py

WHY CUSTOM PERMISSIONS: DRF's built-in permissions only know about
"authenticated or not". Our app has three distinct roles that must not be
able to touch each other's endpoints (a job seeker must never be able to
post a job; a recruiter must never see another recruiter's applicants).
These small, composable permission classes are attached per-view.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsJobSeeker(BasePermission):
    message = "Only job seekers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'job_seeker')


class IsRecruiter(BasePermission):
    message = "Only recruiters can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'recruiter')


class IsAdminRole(BasePermission):
    message = "Only admins can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsOwnerOrReadOnly(BasePermission):
    """
    Generic object-level check: anyone can read (list/retrieve), but only the
    object's own creator can edit/delete it. Used for Job (recruiter owns
    it) and Company (recruiter owns it).
    """
    message = "You do not own this resource."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, 'recruiter', None) or getattr(obj, 'created_by', None)
        return owner == request.user
