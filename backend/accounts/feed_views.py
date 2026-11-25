from django.db.models import Count, Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .feed_models import Comment, Post, PostLike
from .models import Connection


def author_data(user, request):
    """The small bit of info shown next to a post or comment."""
    seeker = getattr(user, 'jobseeker_profile', None)
    recruiter = getattr(user, 'recruiter_profile', None)
    photo = request.build_absolute_uri(seeker.photo.url) if seeker and seeker.photo else None
    if seeker:
        headline = seeker.headline
    elif recruiter:
        headline = recruiter.designation
    else:
        headline = ''
    return {
        'username': user.username,
        'full_name': seeker.full_name if seeker and seeker.full_name else user.username,
        'headline': headline,
        'photo': photo,
        'role': user.role,
    }


def post_data(post, request, liked_ids):
    return {
        'id': post.id,
        'author': author_data(post.author, request),
        'content': post.content,
        'created_at': post.created_at,
        'like_count': post.like_total,
        'comment_count': post.comment_total,
        'liked_by_me': post.id in liked_ids,
        'is_mine': post.author_id == request.user.id,
    }


def comment_data(c, request):
    return {
        'id': c.id,
        'author': author_data(c.author, request),
        'content': c.content,
        'created_at': c.created_at,
        'is_mine': c.author_id == request.user.id,
    }


def network_ids(user):
    """Me + everyone I am connected with."""
    ids = {user.id}
    rows = Connection.objects.filter(
        Q(sender=user) | Q(receiver=user), status=Connection.Status.ACCEPTED
    )
    for c in rows:
        ids.add(c.sender_id)
        ids.add(c.receiver_id)
    return ids


class FeedView(APIView):
    """GET /api/auth/posts/ -> my feed      POST -> write a post"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        posts = list(
            Post.objects.filter(author_id__in=network_ids(request.user))
            .select_related('author', 'author__jobseeker_profile', 'author__recruiter_profile')
            .annotate(like_total=Count('likes', distinct=True), comment_total=Count('comments', distinct=True))
            .order_by('-created_at')[:50]
        )
        liked = set(
            PostLike.objects.filter(user=request.user, post_id__in=[p.id for p in posts])
            .values_list('post_id', flat=True)
        )
        return Response([post_data(p, request, liked) for p in posts])

    def post(self, request):
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Write something first.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 3000:
            return Response({'error': 'A post can be at most 3000 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        post = Post.objects.create(author=request.user, content=content)
        post.like_total = 0
        post.comment_total = 0
        return Response(post_data(post, request, set()), status=status.HTTP_201_CREATED)


class PostDetailView(APIView):
    """DELETE /api/auth/posts/<id>/ -> delete my own post"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        post = Post.objects.filter(pk=pk, author=request.user).first()
        if post is None:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LikeView(APIView):
    """POST /api/auth/posts/<id>/like/ -> like, or un-like if already liked"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = Post.objects.filter(pk=pk).first()
        if post is None:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
        else:
            # Tell the post's author (imported here to avoid circular imports)
            from .notification_models import Notification
            from .notification_views import notify
            notify(post.author, request.user, Notification.Kind.POST_LIKE, post.id)
        return Response({'liked': created, 'like_count': post.likes.count()})


class CommentsView(APIView):
    """GET /api/auth/posts/<id>/comments/ -> list      POST -> add a comment"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        rows = Comment.objects.filter(post_id=pk).select_related(
            'author', 'author__jobseeker_profile', 'author__recruiter_profile'
        )
        return Response([comment_data(c, request) for c in rows])

    def post(self, request, pk):
        post = Post.objects.filter(pk=pk).first()
        if post is None:
            return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Write a comment first.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 1000:
            return Response({'error': 'A comment can be at most 1000 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        c = Comment.objects.create(post=post, author=request.user, content=content)

        # Tell the post's author
        from .notification_models import Notification
        from .notification_views import notify
        notify(post.author, request.user, Notification.Kind.POST_COMMENT, post.id)

        return Response(comment_data(c, request), status=status.HTTP_201_CREATED)