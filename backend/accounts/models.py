"""
accounts/models.py

Custom User (with a role) plus the profile, connection and experience tables.
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
    headline = models.CharField(max_length=200, blank=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    bio = models.TextField(blank=True)
    skills = models.CharField(
        max_length=500, blank=True,
        help_text="Comma-separated skills, e.g. 'Python, React, SQL'."
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

    def __str__(self):
        return f"RecruiterProfile<{self.user.username}>"


class Connection(models.Model):
    """
    A connection between two people, like LinkedIn.
    pending  -> the receiver has not answered yet
    accepted -> they are now connected
    (Declining, cancelling or removing a connection simply deletes the row.)
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_connections')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_connections')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Experience(models.Model):
    """One job in a person's work history (like the Experience section on LinkedIn)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    title = models.CharField(max_length=150)
    company = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Leave empty if this is the current job.")
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.user.username}: {self.title} at {self.company}"


class Education(models.Model):
    """One school / college in a person's education history."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    school = models.CharField(max_length=200)
    degree = models.CharField(max_length=150)
    field_of_study = models.CharField(max_length=150, blank=True)
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField(null=True, blank=True, help_text="Leave empty if still studying.")

    class Meta:
        ordering = ['-start_year']

    def __str__(self):
        return f"{self.user.username}: {self.degree} at {self.school}"


from .feed_models import Post, PostLike, Comment  
from .message_models import Message 
from .notification_models import Notification  # noqa: E402,F401