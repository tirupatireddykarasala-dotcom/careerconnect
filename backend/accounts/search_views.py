from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .feed_views import author_data

User = get_user_model()


class PeopleSearchView(APIView):
    """GET /api/auth/people/?q=ravi  -> people whose name, headline, skills or location match"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()
        if len(q) < 2:
            return Response([])

        users = (
            User.objects
            .exclude(role=User.Role.ADMIN)
            .exclude(id=request.user.id)
            .filter(is_active_account=True)
            .filter(
                Q(username__icontains=q)
                | Q(jobseeker_profile__full_name__icontains=q)
                | Q(jobseeker_profile__headline__icontains=q)
                | Q(jobseeker_profile__skills__icontains=q)
                | Q(jobseeker_profile__location__icontains=q)
                | Q(recruiter_profile__designation__icontains=q)
            )
            .select_related('jobseeker_profile', 'recruiter_profile')
            .distinct()[:30]
        )
        return Response([author_data(u, request) for u in users])