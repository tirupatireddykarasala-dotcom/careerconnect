"""
applications/models.py

WHY unique_together ON (job, job_seeker):
Prevents the same job seeker from applying to the same job twice, at the
DATABASE level — not just a UI check that a determined user could bypass by
calling the API directly with a tool like Postman.

WHY THE STATUS FIELD IS A TextChoices ENUM:
The brief requires exactly these six stages: Applied -> Under Review ->
Shortlisted -> Interview -> Selected/Rejected. Storing this as a constrained
choice (rather than a free-text string) means the database and the DRF
serializer both reject an invalid status like "Maybe", and the React status
badge can map each value to a fixed color.
"""
from django.db import models
from django.conf import settings
from jobs.models import Job


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        UNDER_REVIEW = 'under_review', 'Under Review'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        INTERVIEW = 'interview', 'Interview'
        SELECTED = 'selected', 'Selected'
        REJECTED = 'rejected', 'Rejected'

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    job_seeker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications'
    )
    # A snapshot of the resume used for THIS application. Job seekers may
    # update their profile resume later; keeping a per-application copy
    # means a recruiter always sees the exact resume that was submitted.
    resume = models.FileField(upload_to='application_resumes/')
    cover_note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'job_seeker')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.job_seeker.username} -> {self.job.title} [{self.status}]"


class ApplicationStatusHistory(models.Model):
    """
    Audit trail: every time a recruiter changes an application's status, we
    log it here. This is what lets a job seeker see "Under Review on 3 Oct,
    Shortlisted on 6 Oct" instead of only the current status.
    """
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20, choices=Application.Status.choices)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['changed_at']
