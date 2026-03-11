from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/',           views.RegisterView.as_view()),
    path('auth/login/',              views.LoginView.as_view()),
    path('auth/logout/',             views.LogoutView.as_view()),
    path('auth/me/',                 views.MeView.as_view()),
    path('auth/token/refresh/',      TokenRefreshView.as_view()),
    path('auth/profil/',             views.ProfilView.as_view()),
    path('auth/avatar/',             views.AvatarView.as_view()),
    path('auth/mot-de-passe-oublie/', views.MotDePasseOublieView.as_view()),
    path('auth/reset-password/',     views.ResetMotDePasseView.as_view()),

    # Dashboard + recherche + notifications
    path('dashboard/',               views.DashboardView.as_view()),
    path('recherche/',               views.RechercheGlobaleView.as_view()),
    path('notifications/',           views.NotificationsView.as_view()),

    # Clients
    path('clients/',                         views.ClientListView.as_view()),
    path('clients/<int:pk>/',                views.ClientDetailView.as_view()),
    path('clients/<int:pk>/historique/',     views.ClientHistoriqueView.as_view()),
    path('clients/<int:pk>/pdf/',            views.ClientPDFView.as_view()),
    path('clients/export/excel/',            views.ExportClientsExcelView.as_view()),

    # Interactions
    path('interactions/',            views.InteractionListView.as_view()),
    path('interactions/<int:pk>/',   views.InteractionDetailView.as_view()),

    # Rendez-vous
    path('rendez-vous/',                          views.RendezVousListView.as_view()),
    path('rendez-vous/<int:pk>/',                 views.RendezVousDetailView.as_view()),
    path('rendez-vous/<int:pk>/notifier/',        views.NotifierRdvView.as_view()),
    path('rendez-vous/confirmer/<str:token>/',    views.ConfirmerRdvView.as_view()),

    # Prestations
    path('prestations/',                          views.PrestationListView.as_view()),
    path('prestations/<int:pk>/',                 views.PrestationDetailView.as_view()),
    path('prestations/export/excel/',             views.ExportPrestationsExcelView.as_view()),

    # Fidélisation
    path('fidelisation/',            views.MessageFidelisationListView.as_view()),
    path('fidelisation/<int:pk>/',   views.MessageFidelisationDetailView.as_view()),

    # Campagnes
    path('campagnes/',                            views.CampagneListView.as_view()),
    path('campagnes/executer-toutes/',            views.ExecuterToutesCampagnesView.as_view()),
    path('campagnes/<int:pk>/',                   views.CampagneDetailView.as_view()),
    path('campagnes/<int:pk>/executer/',          views.ExecuterCampagneView.as_view()),
]