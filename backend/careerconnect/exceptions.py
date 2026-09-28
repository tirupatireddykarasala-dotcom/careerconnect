"""
Central place for turning any exception raised in a view into a consistent
JSON error shape: {"error": "...", "details": {...}}.

WHY: without this, some errors come back as DRF's default {"detail": "..."}
and others as raw Django 500 HTML pages. A consistent shape means the React
frontend can handle every error the same way.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'error': response.data.get('detail', 'Request failed.')
            if isinstance(response.data, dict) else 'Request failed.',
            'details': response.data,
        }
        return response

    # Unhandled exception (e.g. a bug) -> don't leak a stack trace to the client
    return Response(
        {'error': 'Something went wrong on the server.', 'details': str(exc)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
