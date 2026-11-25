from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Connection

User = get_user_model()


def person(user):
    """Turn a User into the small bit of info we show on a connection card."""
    profile = getattr(user, 'jobseeker_profile', None)   # recruiters have no job seeker profile
    return {
        'username': user.username,
        'full_name': (profile.full_name if profile and profile.full_name else user.username),
        'headline': getattr(profile, 'headline', '') if profile else '',
        'role': user.role,
    }


def find_connection(a, b):
    """Is there already a request/connection between a and b, in EITHER direction?"""
    return Connection.objects.filter(Q(sender=a, receiver=b) | Q(sender=b, receiver=a)).first()


class SendRequestView(APIView):
    """POST /api/auth/connections/request/   body: {"username": "someone"}"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target = User.objects.filter(username=request.data.get('username')).first()
        if target is None:
            return Response({'error': 'That person was not found.'}, status=status.HTTP_404_NOT_FOUND)
        if target == request.user:
            return Response({'error': 'You cannot connect with yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.role == 'admin':
            return Response({'error': 'You cannot connect with an admin.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = find_connection(request.user, target)
        if existing:
            msg = 'You are already connected.' if existing.status == Connection.Status.ACCEPTED else 'A request is already pending.'
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        connection = Connection.objects.create(sender=request.user, receiver=target)

        # Tell the other person (imported here to avoid circular imports)
        from .notification_models import Notification
        from .notification_views import notify
        notify(target, request.user, Notification.Kind.CONNECTION_REQUEST)

        return Response({'id': connection.id, 'status': connection.status}, status=status.HTTP_201_CREATED)


class MyConnectionsView(APIView):
    """GET /api/auth/connections/  -> everyone I am connected with"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rows = Connection.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user), status=Connection.Status.ACCEPTED
        ).select_related('sender', 'receiver')
        data = []
        for c in rows:
            other = c.receiver if c.sender == request.user else c.sender
            data.append({'id': c.id, **person(other)})
        return Response(data)


class PendingRequestsView(APIView):
    """GET /api/auth/connections/pending/  -> requests other people sent ME that I have not answered"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rows = Connection.objects.filter(receiver=request.user, status=Connection.Status.PENDING).select_related('sender')
        return Response([{'id': c.id, **person(c.sender)} for c in rows])


class AcceptRequestView(APIView):
    """POST /api/auth/connections/<id>/accept/  - only the RECEIVER can accept"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        c = Connection.objects.filter(pk=pk, receiver=request.user, status=Connection.Status.PENDING).first()
        if c is None:
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        c.status = Connection.Status.ACCEPTED
        c.save(update_fields=['status'])

        # Tell the person who sent the request
        from .notification_models import Notification
        from .notification_views import notify
        notify(c.sender, request.user, Notification.Kind.CONNECTION_ACCEPTED)

        return Response({'id': c.id, 'status': c.status})


class RemoveConnectionView(APIView):
    """
    DELETE /api/auth/connections/<id>/
    One endpoint for: decline a request, cancel a request I sent, or remove a connection.
    Either person in the pair may do it; nobody else can.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        c = Connection.objects.filter(Q(sender=request.user) | Q(receiver=request.user), pk=pk).first()
        if c is None:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        c.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConnectionStatusView(APIView):
    """GET /api/auth/connections/status/<username>/  -> which button should React show?"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        target = User.objects.filter(username=username).first()
        if target is None:
            return Response({'error': 'That person was not found.'}, status=status.HTTP_404_NOT_FOUND)
        if target == request.user:
            return Response({'status': 'self'})
        c = find_connection(request.user, target)
        if c is None:
            return Response({'status': 'none'})
        if c.status == Connection.Status.ACCEPTED:
            return Response({'status': 'connected', 'id': c.id})
        who = 'pending_sent' if c.sender == request.user else 'pending_received'
        return Response({'status': who, 'id': c.id})