"""
Custom management command: python manage.py create_admin

WHY THIS EXISTS: Django's built-in `createsuperuser` has no idea about our
custom `role` field, so a superuser created that way would default to
role='job_seeker' and get rejected by IsAdminRole on every admin endpoint.
This command creates a superuser AND sets role='admin' in one step.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import getpass

User = get_user_model()


class Command(BaseCommand):
    help = "Create an admin-role superuser for CareerConnect."

    def handle(self, *args, **options):
        username = input('Username: ')
        email = input('Email: ')
        password = getpass.getpass('Password: ')

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR('That username already exists.'))
            return

        User.objects.create_superuser(
            username=username, email=email, password=password, role=User.Role.ADMIN
        )
        self.stdout.write(self.style.SUCCESS(f"Admin user '{username}' created."))
