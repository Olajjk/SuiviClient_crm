# ─────────────────────────────────────────────────────────────
#  SuiviClient/urls.py — URLs de l'application
#  Chaque ligne = une URL + la view qui la gère
# ─────────────────────────────────────────────────────────────

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [

    # ── AUTH ──────────────────────────────────────────────
    # POST /api/auth/register/ → créer un compte
    path('auth/register/',        views.RegisterView.as_view()),

    # POST /api/auth/login/ → se connecter, reçoit access + refresh token
    path('auth/login/',           views.LoginView.as_view()),

    # POST /api/auth/logout/ → invalide le refresh token
    path('auth/logout/',          views.LogoutView.as_view()),

    # GET  /api/auth/me/ → infos de l'utilisateur connecté
    path('auth/me/',              views.MeView.as_view()),

    # POST /api/auth/token/refresh/ → renouvelle le access token
    # TokenRefreshView est fournie directement par simplejwt
    path('auth/token/refresh/',   TokenRefreshView.as_view()),


    # ── DASHBOARD ─────────────────────────────────────────
    # GET /api/dashboard/ → statistiques + prochains RDV + dernières interactions
    path('dashboard/',            views.DashboardView.as_view()),


    # ── CLIENTS ───────────────────────────────────────────
    # GET  /api/clients/       → liste des clients (avec filtres)
    # POST /api/clients/       → créer un client
    path('clients/',              views.ClientListView.as_view()),

    # GET    /api/clients/42/  → fiche complète du client 42
    # PUT    /api/clients/42/  → modifier
    # DELETE /api/clients/42/  → supprimer
    # <int:pk> = paramètre dynamique (le 42 dans l'URL)
    path('clients/<int:pk>/',     views.ClientDetailView.as_view()),

    # GET /api/clients/42/historique/ → historique des actions
    path('clients/<int:pk>/historique/', views.ClientHistoriqueView.as_view()),

    # GET /api/clients/42/pdf/ → télécharger la fiche PDF
    path('clients/<int:pk>/pdf/', views.ClientPDFView.as_view()),


    # ── INTERACTIONS ──────────────────────────────────────
    # GET  /api/interactions/  → toutes les interactions
    # POST /api/interactions/  → créer une interaction
    path('interactions/',         views.InteractionListView.as_view()),

    # GET    /api/interactions/5/ → détail
    # PUT    /api/interactions/5/ → modifier
    # DELETE /api/interactions/5/ → supprimer
    path('interactions/<int:pk>/', views.InteractionDetailView.as_view()),


    # ── RENDEZ-VOUS ───────────────────────────────────────
    path('rendez-vous/',              views.RendezVousListView.as_view()),
    path('rendez-vous/<int:pk>/',     views.RendezVousDetailView.as_view()),

    # POST /api/rendez-vous/42/notifier/ → envoie rappel email+SMS manuellement
    path('rendez-vous/<int:pk>/notifier/', views.NotifierRdvView.as_view()),


    # ── PRESTATIONS ───────────────────────────────────────
    path('prestations/',              views.PrestationListView.as_view()),
    path('prestations/<int:pk>/',     views.PrestationDetailView.as_view()),


    # ── FIDELISATION ──────────────────────────────────────
    path('fidelisation/',             views.MessageFidelisationListView.as_view()),
    path('fidelisation/<int:pk>/',    views.MessageFidelisationDetailView.as_view()),


    # ── CAMPAGNES ─────────────────────────────────────────
    path('campagnes/',                views.CampagneListView.as_view()),
    path('campagnes/<int:pk>/',       views.CampagneDetailView.as_view()),

    # POST /api/campagnes/42/executer/ → exécute la campagne 42 manuellement
    path('campagnes/<int:pk>/executer/', views.ExecuterCampagneView.as_view()),

    # POST /api/campagnes/executer-toutes/ → exécute toutes les campagnes actives
    path('campagnes/executer-toutes/',   views.ExecuterToutesCampagnesView.as_view()),
]