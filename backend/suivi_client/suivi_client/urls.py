# ─────────────────────────────────────────────────────────────
#  suivi_client/urls.py — URLs principales du projet
#  Ce fichier inclut les URLs de toutes les applications
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from django.urls import path, include

urlpatterns = [

    # Interface d'administration Django
    # Accessible sur http://localhost:8000/admin/
    path('admin/', admin.site.urls),

    # Toutes les URLs de notre app commencent par /api/
    # include() = délègue à SuiviClient/urls.py
    # Ex: /api/clients/ → SuiviClient/urls.py → ClientListView
    path('api/', include('SuiviClient.urls')),
]