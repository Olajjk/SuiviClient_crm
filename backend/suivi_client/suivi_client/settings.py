from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-changez-moi-en-production')

DEBUG = True

ALLOWED_HOSTS = ['*']

# ── Applications ──────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Packages installés
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',  # ← OBLIGATOIRE pour logout
    'corsheaders',                                # ← OBLIGATOIRE pour React

    # Notre application
    'SuiviClient',
]

# ── Middleware — corsheaders DOIT être en premier ─────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # ← EN PREMIER
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'suivi_client.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'suivi_client.wsgi.application'

# ── Base de données ───────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ── Modèle utilisateur personnalisé ──────────────────────────
AUTH_USER_MODEL = 'SuiviClient.User'

# ── Django REST Framework ─────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ── JWT — tokens d'authentification ──────────────────────────
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),   # token valide 8h
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),    # refresh valide 7 jours
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS — autorise React à parler au backend ─────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
]
CORS_ALLOW_CREDENTIALS = True

# ── Validation mots de passe ──────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Langue et fuseau horaire ──────────────────────────────────
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = 'Africa/Porto-Novo'
USE_I18N      = True
USE_TZ        = True

# ── Fichiers statiques et media (avatars, etc.) ───────────────
STATIC_URL = 'static/'
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL  = '/media/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── SendGrid (email) ──────────────────────────────────────────
SENDGRID_API_KEY    = config('SENDGRID_API_KEY',    default='')
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',  default='folashadebalogoun@gmail.com')

# ── Africa's Talking (SMS) ────────────────────────────────────
AFRICASTALKING_USERNAME = config('AFRICASTALKING_USERNAME', default='sandbox')
AFRICASTALKING_API_KEY  = config('AFRICASTALKING_API_KEY',  default='')

# ── CallMeBot (WhatsApp) ──────────────────────────────────────
META_WHATSAPP_TOKEN    = config('META_WHATSAPP_TOKEN',    default='')
META_WHATSAPP_PHONE_ID = config('META_WHATSAPP_PHONE_ID', default='')

# URL de base — utilisée dans les liens emails (confirmation RDV, etc.)
BASE_URL = config('BASE_URL', default='http://localhost:8000')

# ── Celery (tâches automatiques) ─────────────────────────────
CELERY_BROKER_URL        = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND    = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT    = ['json']
CELERY_TASK_SERIALIZER   = 'json'
CELERY_RESULT_SERIALIZER = 'json'