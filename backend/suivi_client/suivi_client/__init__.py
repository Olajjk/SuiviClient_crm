# Celery désactivé — à réactiver quand Redis sera installé
from .celery import app as celery_app
__all__ = ('celery_app',)