from django.urls import path
from . import views

urlpatterns = [
    path('apply/', views.ApplyToJobView.as_view(), name='apply-job'),
    path('mine/', views.MyApplicationsView.as_view(), name='my-applications'),
    path('job/<int:job_id>/applicants/', views.JobApplicantsView.as_view(), name='job-applicants'),
    path('<int:pk>/status/', views.UpdateApplicationStatusView.as_view(), name='update-application-status'),
    path('<int:pk>/resume/', views.DownloadResumeView.as_view(), name='download-resume'),
    path('admin/all/', views.AdminApplicationListView.as_view(), name='admin-application-list'),
]
