"""
accounts/models.py

WHY A CUSTOM USER MODEL:
Django's built-in User has no idea whether someone is a Job Seeker, a
Recruiter, or an Admin. Rather than bolting a "role" flag onto a separate
table, we extend AbstractUser directly — this is the officially recommended
way to customize Django's auth system, and it keeps login/permissions logic
built into the framework instead of reinvented.

We keep role-specific fields (resume, company, etc.) in separate "profile"
models linked one-to-one to User, instead of cramming everything into one
giant table. This mirrors how real job portals separate "account" data
(email/password/role) from "profile" data (resume, bio, company).
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        JOB_SEEKER = 'job_seeker', 'Job Seeker'
        RECRUITER = 'recruiter', 'Recruiter'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.JOB_SEEKER)
    phone = models.CharField(max_length=20, blank=True)
    is_active_account = models.BooleanField(
        default=True,
        help_text="Admin can deactivate a user without deleting their data."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class JobSeekerProfile(models.Model):
    """Extra fields that only make sense for a job seeker."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='jobseeker_profile')
    full_name = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    skills = models.CharField(
        max_length=500, blank=True,
        help_text="Comma-separated skills, e.g. 'Python, React, SQL' — kept simple for search/filter."
    )
    location = models.CharField(max_length=150, blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    experience_years = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"JobSeekerProfile<{self.user.username}>"


class RecruiterProfile(models.Model):
    """Extra fields that only make sense for a recruiter."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    designation = models.CharField(max_length=150, blank=True)
    # A recruiter's Company is defined in the companies app to avoid a
    # circular import; linked there via a ForeignKey back to this profile.

    def __str__(self):
        return f"RecruiterProfile<{self.user.username}>"
