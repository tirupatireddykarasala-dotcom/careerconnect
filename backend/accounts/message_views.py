from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .feed_views import author_data
from .message_models import Message
from .models import Connection

User = get_user_model()


def are_connected(a, b):
    """Messaging is only allowed between people who are connected."""
    return Connection.objects.filter(
        Q(sender=a, receiver=b) | Q(sender=b, receiver=a),
        status=Connection.Status.ACCEPTED,
    ).exists()


def message_data(m, me):
    return {
        'id': m.id,
        'content': m.content,
        'created_at': m.created_at,
        'mine': m.sender_id == me.id,
    }


class ConversationsView(APIView):
    """GET /api/auth/messages/ -> my connections, with last message and unread count"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user
        rows = Connection.objects.filter(
            Q(sender=me) | Q(receiver=me), status=Connection.Status.ACCEPTED
        ).select_related('sender', 'receiver')

        data = []
        for c in rows:
            other = c.receiver if c.sender_id == me.id else c.sender
            last = (
                Message.objects.filter(Q(sender=me, receiver=other) | Q(sender=other, receiver=me))
                .order_by('-created_at')
                .first()
            )
            unread = Message.objects.filter(sender=other, receiver=me, is_read=False).count()
            data.append({
                'person': author_data(other, request),
                'last_message': last.content[:80] if last else '',
                'last_time': last.created_at if last else None,
                'unread': unread,
            })

        # Newest conversations first; people with no messages yet go last
        data.sort(key=lambda d: d['last_time'].timestamp() if d['last_time'] else 0, reverse=True)
        return Response(data)


class ThreadView(APIView):
    """
    GET  /api/auth/messages/<username>/ -> the chat with that person (marks their messages as read)
    POST /api/auth/messages/<username>/ -> send them a message
    """
    permission_classes = [permissions.IsAuthenticated]

    def _other(self, request, username):
        other = User.objects.filter(username=username).first()
        if other is None:
            return None, Response({'error': 'That person was not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not are_connected(request.user, other):
            return None, Response({'error': 'You can only message your connections.'}, status=status.HTTP_403_FORBIDDEN)
        return other, None

    def get(self, request, username):
        other, error = self._other(request, username)
        if error:
            return error
        me = request.user
        msgs = list(
            Message.objects.filter(Q(sender=me, receiver=other) | Q(sender=other, receiver=me))
        )
        Message.objects.filter(sender=other, receiver=me, is_read=False).update(is_read=True)
        return Response({
            'person': author_data(other, request),
            'messages': [message_data(m, me) for m in msgs],
        })

    def post(self, request, username):
        other, error = self._other(request, username)
        if error:
            return error
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Write a message first.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 2000:
            return Response({'error': 'A message can be at most 2000 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        m = Message.objects.create(sender=request.user, receiver=other, content=content)
        return Response(message_data(m, request.user), status=status.HTTP_201_CREATED)


class UnreadCountView(APIView):
    """GET /api/auth/messages/unread-count/ -> how many unread messages I have (for the navbar badge)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'unread': Message.objects.filter(receiver=request.user, is_read=False).count()})