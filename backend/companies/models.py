"""
companies/models.py

WHY A SEPARATE Company MODEL (instead of fields on RecruiterProfile):
Multiple recruiters can work for the same company (e.g. two HR staff at
Infosys posting jobs). Modeling Company on its own table, with recruiters
pointing to it, avoids duplicating "Infosys, infosys.com, logo.png" every
time a new recruiter signs up under that company — a classic normalization
decision.
"""
from django.db import models
from django.conf import settings


class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    location = models.CharField(max_length=150, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='companies_created',
        help_text="The recruiter who registered this company."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class RecruiterCompany(models.Model):
    """
    Many-to-many join: which recruiters belong to which company.
    A recruiter must belong to a company before they can post jobs.
    """
    recruiter = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='company_membership'
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='recruiters')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recruiter.username} @ {self.company.name}"
