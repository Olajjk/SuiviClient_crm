# ─────────────────────────────────────────────────────────────
#  suivi_client/celery.py — Configuration Celery
# ─────────────────────────────────────────────────────────────

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'suivi_client.settings')

app = Celery('suivi_client')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ── Planning automatique ──────────────────────────────────────
app.conf.beat_schedule = {

    # Rappels interactions planifiées du jour → 7h30 chaque matin
    'rappels-interactions-quotidiens': {
        'task': 'SuiviClient.tasks.envoyer_rappels_interactions',
        'schedule': crontab(hour=7, minute=30),
    },

    # Rappels RDV du lendemain → 8h00 chaque matin
    'rappels-rdv-quotidiens': {
        'task': 'SuiviClient.tasks.envoyer_rappels_rdv',
        'schedule': crontab(hour=8, minute=0),
    },

    # Relance clients inactifs → 1er et 15 de chaque mois à 9h00 (2x/mois, anti-spam géré dans la tâche)
    'relancer-clients-inactifs-1er': {
        'task': 'SuiviClient.tasks.relancer_clients_inactifs',
        'schedule': crontab(hour=9, minute=0, day_of_month=1),
    },
    'relancer-clients-inactifs-15': {
        'task': 'SuiviClient.tasks.relancer_clients_inactifs',
        'schedule': crontab(hour=9, minute=0, day_of_month=15),
    },

    # Toutes les campagnes actives → chaque lundi à 9h00
    'campagnes-hebdomadaires': {
        'task': 'SuiviClient.tasks.executer_toutes_campagnes',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
    },
}

app.conf.timezone = 'Africa/Porto-Novo'