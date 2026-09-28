from django.contrib import admin
from .models import Job, SavedJob


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'recruiter', 'location', 'is_active', 'posted_at')
    list_filter = ('is_active', 'job_type', 'location')
    search_fields = ('title', 'skills_required')


admin.site.register(SavedJob)
