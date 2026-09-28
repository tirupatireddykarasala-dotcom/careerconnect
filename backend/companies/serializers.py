from rest_framework import serializers
from .models import Company, RecruiterCompany


class CompanySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'website', 'logo', 'location',
                  'created_by', 'created_by_username', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['created_by'] = request.user
        company = Company.objects.create(**validated_data)
        # Automatically attach the creating recruiter as a member of the company
        RecruiterCompany.objects.get_or_create(recruiter=request.user, company=company)
        return company
