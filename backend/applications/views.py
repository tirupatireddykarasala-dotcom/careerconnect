"""
applications/views.py

WHY get_queryset() IS SO IMPORTANT HERE:
This app handles the most sensitive data in the whole project — resumes and
application statuses. Every view below scopes its queryset to "only rows
belonging to the logged-in user" so that, for example, a job seeker can
never fetch /api/applications/<id>/ for someone else's application just by
guessing an id in the URL (an "IDOR" vulnerability). This is safer than
relying on permission classes alone.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404

from .models import Application, ApplicationStatusHistory
from .serializers import ApplicationSerializer, ApplicantSerializer, UpdateApplicationStatusSerializer
from accounts.permissions import IsJobSeeker, IsRecruiter, IsAdminRole


class ApplyToJobView(generics.CreateAPIView):
    """POST /api/applications/apply/  (multipart form: job, resume, cover_note)"""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Friendly duplicate-application error instead of a raw DB IntegrityError
        if Application.objects.filter(job_id=request.data.get('job'), job_seeker=request.user).exists():
            return Response({'error': 'You have already applied to this job.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)


class MyApplicationsView(generics.ListAPIView):
    """GET /api/applications/mine/ — job seeker's own applications + status."""
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]
    filterset_fields = ['status']

    def get_queryset(self):
        return Application.objects.filter(job_seeker=self.request.user).select_related('job', 'job__company')


class JobApplicantsView(generics.ListAPIView):
    """
    GET /api/applications/job/<job_id>/applicants/
    A recruiter viewing applicants for ONE of their own jobs.
    """
    serializer_class = ApplicantSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    filterset_fields = ['status']

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        # .filter(job__recruiter=...) guarantees a recruiter can only ever
        # see applicants for jobs THEY posted, even if they guess another
        # recruiter's job id.
        return Application.objects.filter(
            job_id=job_id, job__recruiter=self.request.user
        ).select_related('job_seeker', 'job_seeker__jobseeker_profile')


class UpdateApplicationStatusView(generics.UpdateAPIView):
    """PATCH /api/applications/<id>/status/  body: {"status": "shortlisted"}"""
    serializer_class = UpdateApplicationStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Application.objects.filter(job__recruiter=self.request.user)

    def perform_update(self, serializer):
        application = serializer.save()
        ApplicationStatusHistory.objects.create(
            application=application, status=application.status, changed_by=self.request.user
        )


class DownloadResumeView(APIView):
    """
    GET /api/applications/<id>/resume/
    Only the recruiter who owns the job, or the job seeker who applied, may
    download the resume — enforced explicitly rather than trusting the URL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            application = Application.objects.select_related('job').get(pk=pk)
        except Application.DoesNotExist:
            raise Http404

        is_owner_recruiter = request.user == application.job.recruiter
        is_owner_seeker = request.user == application.job_seeker
        if not (is_owner_recruiter or is_owner_seeker):
            return Response({'error': 'You do not have access to this resume.'}, status=status.HTTP_403_FORBIDDEN)

        return FileResponse(application.resume.open('rb'), as_attachment=True,
                             filename=application.resume.name.split('/')[-1])


class AdminApplicationListView(generics.ListAPIView):
    """GET /api/applications/admin/all/ — every application on the platform, for oversight/disputes."""
    serializer_class = ApplicantSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filterset_fields = ['status']
    queryset = Application.objects.all().select_related('job', 'job_seeker', 'job_seeker__jobseeker_profile')
