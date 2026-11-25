from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, connection_views, profile_views, feed_views, message_views, search_views, notification_views


urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='login-refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('bootstrap-admin/', views.BootstrapAdminView.as_view(), name='bootstrap-admin'),
    path('reset-admin-password/', views.ResetAdminPasswordView.as_view(), name='reset-admin-password'),

    path('profile/jobseeker/', views.MyJobSeekerProfileView.as_view(), name='jobseeker-profile'),
    path('profile/recruiter/', views.MyRecruiterProfileView.as_view(), name='recruiter-profile'),
    path('experiences/', profile_views.MyExperiencesView.as_view(), name='my-experiences'),
    path('experiences/<int:pk>/', profile_views.MyExperienceDetailView.as_view(), name='my-experience-detail'),
    path('educations/', profile_views.MyEducationsView.as_view(), name='my-educations'),
    path('educations/<int:pk>/', profile_views.MyEducationDetailView.as_view(), name='my-education-detail'),
    path('posts/', feed_views.FeedView.as_view(), name='feed'),
    path('posts/<int:pk>/', feed_views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', feed_views.LikeView.as_view(), name='post-like'),
    path('posts/<int:pk>/comments/', feed_views.CommentsView.as_view(), name='post-comments'),
    path('messages/', message_views.ConversationsView.as_view(), name='conversations'),
    path('messages/unread-count/', message_views.UnreadCountView.as_view(), name='messages-unread'),
    path('messages/<str:username>/', message_views.ThreadView.as_view(), name='message-thread'),
    path('people/', search_views.PeopleSearchView.as_view(), name='people-search'),
    path('people/', search_views.PeopleSearchView.as_view(), name='people-search'),
    path('notifications/', notification_views.NotificationsView.as_view(), name='notifications'),
    path('notifications/unread-count/', notification_views.NotificationUnreadCountView.as_view(), name='notifications-unread'),
    path('notifications/read-all/', notification_views.NotificationsReadAllView.as_view(), name='notifications-read-all'),
        # Connections (like LinkedIn)
    path('connections/', connection_views.MyConnectionsView.as_view(), name='my-connections'),
    path('connections/request/', connection_views.SendRequestView.as_view(), name='connection-request'),
    path('connections/pending/', connection_views.PendingRequestsView.as_view(), name='connection-pending'),
    path('connections/status/<str:username>/', connection_views.ConnectionStatusView.as_view(), name='connection-status'),
    path('connections/<int:pk>/accept/', connection_views.AcceptRequestView.as_view(), name='connection-accept'),
    path('connections/<int:pk>/', connection_views.RemoveConnectionView.as_view(), name='connection-remove'),
    path('admin/dashboard/', views.AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/toggle-active/', views.AdminUserToggleActiveView.as_view(), name='admin-user-toggle'),
]
