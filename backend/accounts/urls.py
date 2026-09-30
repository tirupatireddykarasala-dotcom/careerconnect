from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='login-refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('bootstrap-admin/', views.BootstrapAdminView.as_view(), name='bootstrap-admin'),
    path('reset-admin-password/', views.ResetAdminPasswordView.as_view(), name='reset-admin-password'),

    path('profile/jobseeker/', views.MyJobSeekerProfileView.as_view(), name='jobseeker-profile'),
    path('profile/recruiter/', views.MyRecruiterProfileView.as_view(), name='recruiter-profile'),

    path('admin/dashboard/', views.AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/toggle-active/', views.AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
]
