"""
jobs/views.py

WHY get_queryset() FILTERS BY is_active FOR THE PUBLIC LIST:
Job seekers browsing/searching should never see a job the recruiter closed.
But the recruiter's OWN "My Postings" view (RecruiterJobListView) must show
inactive jobs too, so they can re-open them — hence two different list
views instead of one with a hidden flag.
"""
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Job, SavedJob
from .serializers import JobSerializer, SavedJobSerializer
from .filters import JobFilter
from accounts.permissions import IsRecruiter, IsJobSeeker, IsOwnerOrReadOnly, IsAdminRole
from companies.models import RecruiterCompany


class JobListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/jobs/            -> public search/browse (active jobs only)
    POST /api/jobs/            -> recruiter creates a job posting
    Query params: ?location=&skills=&job_type=&min_salary=&max_salary=&title=&search=&ordering=
    """
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = JobFilter
    search_fields = ['title', 'description', 'skills_required', 'location']
    ordering_fields = ['posted_at', 'salary_min', 'salary_max']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsRecruiter()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.request.method == 'POST':
            return Job.objects.all()
        return Job.objects.filter(is_active=True).select_related('company', 'recruiter')

    def perform_create(self, serializer):
        # A recruiter must belong to a company before posting — this is the
        # rule "recruiters create a company profile first" enforced server-side.
        membership = RecruiterCompany.objects.filter(recruiter=self.request.user).first()
        if not membership:
            raise ValidationError({'company': 'Create your company profile before posting a job.'})
        if serializer.validated_data.get('company') != membership.company:
            raise PermissionDenied('You can only post jobs under your own company.')
        serializer.save()


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET (anyone) / PUT,PATCH,DELETE (only the recruiter who owns the job)."""
    queryset = Job.objects.all().select_related('company', 'recruiter')
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated(), IsRecruiter(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]


class RecruiterJobListView(generics.ListAPIView):
    """GET /api/jobs/mine/ — a recruiter's own postings, active or not."""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user).select_related('company')


# ---------------------------------------------------------------------------
# Saved jobs (job seeker bookmarks)
# ---------------------------------------------------------------------------
class SavedJobListCreateView(generics.ListCreateAPIView):
    """GET list of my saved jobs / POST {job: <id>} to save one."""
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]

    def get_queryset(self):
        return SavedJob.objects.filter(job_seeker=self.request.user).select_related('job', 'job__company')


class SavedJobDeleteView(generics.DestroyAPIView):
    """DELETE /api/jobs/saved/<id>/ — un-save a job."""
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]

    def get_queryset(self):
        return SavedJob.objects.filter(job_seeker=self.request.user)


# ---------------------------------------------------------------------------
# Admin: manage every job on the platform (moderation)
# ---------------------------------------------------------------------------
class AdminJobListView(generics.ListAPIView):
    """GET /api/jobs/admin/all/ — every job, active or not, from every recruiter."""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filterset_class = JobFilter
    queryset = Job.objects.all().select_related('company', 'recruiter')


class AdminJobDeleteView(generics.DestroyAPIView):
    """DELETE /api/jobs/admin/<id>/ — admin can remove any inappropriate posting."""
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    queryset = Job.objects.all()
