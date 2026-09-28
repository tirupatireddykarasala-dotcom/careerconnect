from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, JobSeekerProfile, RecruiterProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active_account', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('CareerConnect', {'fields': ('role', 'phone', 'is_active_account')}),
    )


admin.site.register(JobSeekerProfile)
admin.site.register(RecruiterProfile)
