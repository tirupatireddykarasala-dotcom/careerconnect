from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .feed_views import author_data
from .notification_models import Notification

TEXT = {
    Notification.Kind.CONNECTION_REQUEST: 'sent you a connection request',
    Notification.Kind.CONNECTION_ACCEPTED: 'accepted your connection request',
    Notification.Kind.POST_LIKE: 'liked your post',
    Notification.Kind.POST_COMMENT: 'commented on your post',
}

# Where clicking the notification should take you
LINK = {
    Notification.Kind.CONNECTION_REQUEST: '/network',
    Notification.Kind.CONNECTION_ACCEPTED: '/network',
    Notification.Kind.POST_LIKE: '/feed',
    Notification.Kind.POST_COMMENT: '/feed',
}


def notify(recipient, actor, kind, post_id=None):
    """Create a notification. Never notify people about their own actions."""
    if recipient.id == actor.id:
        return
    Notification.objects.create(recipient=recipient, actor=actor, kind=kind, post_id=post_id)


class NotificationsView(APIView):
    """GET /api/auth/notifications/ -> my latest 30 notifications"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rows = (
            Notification.objects.filter(recipient=request.user)
            .select_related('actor', 'actor__jobseeker_profile', 'actor__recruiter_profile')[:30]
        )
        return Response([
            {
                'id': n.id,
                'actor': author_data(n.actor, request),
                'text': TEXT.get(n.kind, ''),
                'link': LINK.get(n.kind, '/feed'),
                'is_read': n.is_read,
                'created_at': n.created_at,
            }
            for n in rows
        ])


class NotificationUnreadCountView(APIView):
    """GET /api/auth/notifications/unread-count/ -> the number shown on the bell"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'unread': Notification.objects.filter(recipient=request.user, is_read=False).count()})


class NotificationsReadAllView(APIView):
    """POST /api/auth/notifications/read-all/ -> mark everything as read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'unread': 0})