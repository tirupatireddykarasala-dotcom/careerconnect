from rest_framework import serializers
from .models import Application, ApplicationStatusHistory
from jobs.serializers import JobSerializer


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True, default=None)

    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'status', 'changed_by_username', 'changed_at']


class ApplicationSerializer(serializers.ModelSerializer):
    """Used by the job seeker: apply, and view 'my applications'."""
    job_detail = JobSerializer(source='job', read_only=True)
    job_seeker_username = serializers.CharField(source='job_seeker.username', read_only=True)
    history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_detail', 'job_seeker', 'job_seeker_username',
            'resume', 'cover_note', 'status', 'applied_at', 'updated_at', 'history',
        ]
        read_only_fields = ['id', 'job_seeker', 'status', 'applied_at', 'updated_at']

    def validate_job(self, job):
        if not job.is_active:
            raise serializers.ValidationError("This job is no longer accepting applications.")
        return job

    def create(self, validated_data):
        request = self.context['request']
        validated_data['job_seeker'] = request.user
        application = Application.objects.create(**validated_data)
        ApplicationStatusHistory.objects.create(
            application=application, status=Application.Status.APPLIED, changed_by=request.user
        )
        return application


class ApplicantSerializer(serializers.ModelSerializer):
    """
    Used by the RECRUITER: viewing who applied to their job. Deliberately a
    separate serializer from ApplicationSerializer — a recruiter needs the
    applicant's contact details and skills, which a job seeker viewing their
    own application list does not need duplicated back to them.
    """
    applicant_username = serializers.CharField(source='job_seeker.username', read_only=True)
    applicant_email = serializers.EmailField(source='job_seeker.email', read_only=True)
    applicant_skills = serializers.CharField(source='job_seeker.jobseeker_profile.skills', read_only=True, default='')
    applicant_experience = serializers.IntegerField(source='job_seeker.jobseeker_profile.experience_years', read_only=True, default=0)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'applicant_username', 'applicant_email', 'applicant_skills',
            'applicant_experience', 'resume', 'cover_note', 'status', 'applied_at',
        ]
        read_only_fields = fields


class UpdateApplicationStatusSerializer(serializers.ModelSerializer):
    """A tiny, purpose-built serializer: recruiters may change ONLY the status field."""
    class Meta:
        model = Application
        fields = ['status']
