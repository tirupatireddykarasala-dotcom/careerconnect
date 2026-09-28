from django.urls import path
from . import views

urlpatterns = [
    path('', views.JobListCreateView.as_view(), name='job-list-create'),
    path('mine/', views.RecruiterJobListView.as_view(), name='job-mine'),
    path('<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('saved/', views.SavedJobListCreateView.as_view(), name='saved-job-list-create'),
    path('saved/<int:pk>/', views.SavedJobDeleteView.as_view(), name='saved-job-delete'),
    path('admin/all/', views.AdminJobListView.as_view(), name='admin-job-list'),
    path('admin/<int:pk>/', views.AdminJobDeleteView.as_view(), name='admin-job-delete'),
]
