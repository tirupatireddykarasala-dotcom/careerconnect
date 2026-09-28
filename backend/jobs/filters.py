"""
jobs/filters.py

WHY A SEPARATE FilterSet: the job search page needs location + skills +
salary-range filtering combined with free-text search — more than
`filterset_fields` (simple exact-match) can express. django-filter's
FilterSet class lets us define exactly how each query param should be
interpreted (contains, gte, lte, etc.) in one readable place.
"""
import django_filters
from .models import Job


class JobFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(field_name='location', lookup_expr='icontains')
    skills = django_filters.CharFilter(field_name='skills_required', lookup_expr='icontains')
    job_type = django_filters.CharFilter(field_name='job_type', lookup_expr='iexact')
    min_salary = django_filters.NumberFilter(field_name='salary_max', lookup_expr='gte')
    max_salary = django_filters.NumberFilter(field_name='salary_min', lookup_expr='lte')
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    class Meta:
        model = Job
        fields = ['location', 'skills', 'job_type', 'min_salary', 'max_salary', 'title']
