from django.conf import settings
from django.db import models


class Notification(models.Model):
    """One item in the bell menu: 'Ravi sent you a connection request', 'Sita liked your post', ..."""

    class Kind(models.TextChoices):
        CONNECTION_REQUEST = 'connection_request', 'Connection request'
        CONNECTION_ACCEPTED = 'connection_accepted', 'Connection accepted'
        POST_LIKE = 'post_like', 'Post like'
        POST_COMMENT = 'post_comment', 'Post comment'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='+')
    kind = models.CharField(max_length=30, choices=Kind.choices)
    post_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.actor.username} -> {self.recipient.username}: {self.kind}"