from rest_framework import serializers
from .models import Job, SavedJob
from companies.serializers import CompanySerializer


class JobSerializer(serializers.ModelSerializer):
    """Used for job listing/detail — includes nested company info so the
    React job card can show the company name/logo without a second request."""
    company_detail = CompanySerializer(source='company', read_only=True)
    recruiter_username = serializers.CharField(source='recruiter.username', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'responsibilities', 'location', 'job_type',
            'skills_required', 'salary_min', 'salary_max', 'is_active', 'posted_at',
            'updated_at', 'company', 'company_detail', 'recruiter', 'recruiter_username',
            'is_saved',
        ]
        read_only_fields = ['id', 'recruiter', 'posted_at', 'updated_at']

    def get_is_saved(self, obj):
        """
        True if the currently logged-in job seeker has bookmarked this job.
        Returns False (not an error) for recruiters/anonymous requests, so
        the same serializer works on every role's job list.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user.role != 'job_seeker':
            return False
        return SavedJob.objects.filter(job_seeker=request.user, job=obj).exists()

    def create(self, validated_data):
        validated_data['recruiter'] = self.context['request'].user
        # A brand-new posting is always active — closing a job is a deliberate
        # later action (PATCH), not something set at creation time. This also
        # sidesteps a DRF quirk where an omitted BooleanField in multipart/
        # form-data (e.g. a Postman "form-data" request) is read as False
        # instead of falling back to the model's default=True.
        validated_data['is_active'] = True
        return super().create(validated_data)


class SavedJobSerializer(serializers.ModelSerializer):
    job_detail = JobSerializer(source='job', read_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'job_detail', 'saved_at']
        read_only_fields = ['id', 'saved_at']

    def create(self, validated_data):
        validated_data['job_seeker'] = self.context['request'].user
        return super().create(validated_data)
