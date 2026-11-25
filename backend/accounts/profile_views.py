from rest_framework import generics, permissions, serializers

from .models import Education, Experience


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'title', 'company', 'location', 'start_date', 'end_date', 'description']

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date cannot be before the start date.'})
        return attrs


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'school', 'degree', 'field_of_study', 'start_year', 'end_year']

    def validate(self, attrs):
        start = attrs.get('start_year')
        end = attrs.get('end_year')
        if start and end and end < start:
            raise serializers.ValidationError({'end_year': 'End year cannot be before the start year.'})
        return attrs


class MyExperiencesView(generics.ListCreateAPIView):
    """GET /api/auth/experiences/  -> my jobs      POST -> add a job"""
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/auth/experiences/<id>/  (only my own jobs)"""
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)


class MyEducationsView(generics.ListCreateAPIView):
    """GET /api/auth/educations/  -> my schools      POST -> add one"""
    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MyEducationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/auth/educations/<id>/  (only my own)"""
    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)