from django.contrib import admin
from .models import Application, ApplicationStatusHistory


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('job_seeker', 'job', 'status', 'applied_at')
    list_filter = ('status',)
    search_fields = ('job__title', 'job_seeker__username')


admin.site.register(ApplicationStatusHistory)
