"""
jobs/models.py

WHY salary_min/salary_max (not one "salary" field):
Real job posts are ranges ("₹8–12 LPA"), and filtering "show me jobs with
salary >= X" only works cleanly against numeric bounds, not a free-text
string like "8-12 LPA" or "Competitive".

WHY skills_required is a plain CharField, not a M2M to a Skill table:
For an MVP, comma-separated skills keep the schema simple and are still
fully filterable with Django's `icontains`. A production app would likely
normalize this into a Skill model + M2M, but that's a deliberate scope cut
explained in the README.
"""
from django.db import models
from django.conf import settings
from companies.models import Company


class Job(models.Model):
    class JobType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        PART_TIME = 'part_time', 'Part-time'
        CONTRACT = 'contract', 'Contract'
        INTERNSHIP = 'internship', 'Internship'
        REMOTE = 'remote', 'Remote'

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs_posted'
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    responsibilities = models.TextField(blank=True)
    location = models.CharField(max_length=150, db_index=True)
    job_type = models.CharField(max_length=20, choices=JobType.choices, default=JobType.FULL_TIME)
    skills_required = models.CharField(
        max_length=500,
        help_text="Comma-separated, e.g. 'Python, Django, MySQL'"
    )
    salary_min = models.PositiveIntegerField(default=0, help_text="Annual salary, lower bound")
    salary_max = models.PositiveIntegerField(default=0, help_text="Annual salary, upper bound")
    is_active = models.BooleanField(default=True, help_text="Recruiter can close a posting without deleting it.")
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-posted_at']

    def __str__(self):
        return f"{self.title} @ {self.company.name}"


class SavedJob(models.Model):
    """A job seeker's personal 'bookmark' list."""
    job_seeker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_jobs'
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_seeker', 'job')  # can't save the same job twice

    def __str__(self):
        return f"{self.job_seeker.username} saved {self.job.title}"
