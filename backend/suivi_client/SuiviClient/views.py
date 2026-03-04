# ─────────────────────────────────────────────────────────────
#  views.py — Logique de l'API
#  Chaque view = une URL qui répond à React
#
#  GET    /api/clients/     → liste des clients
#  POST   /api/clients/     → créer un client
#  GET    /api/clients/42/  → détail du client 42
#  PUT    /api/clients/42/  → modifier le client 42
#  DELETE /api/clients/42/  → supprimer le client 42
# ─────────────────────────────────────────────────────────────

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta

from .models import (
    Client, Interaction, RendezVous,
    MessageFidelisation, Campagne,
    Prestation, HistoriqueClient
)
from .serializers import (
    UserSerializers, RegisterSerializer,
    clientListeSerializers, ClientDetailSerializer,
    InteractionSerializer, RendezVousSerializer,
    PrestationSerializer, MessageFidelisationSerializer,
    CampagneSerializer, HistoriqueClientSerializer
)

User = get_user_model()


# ══════════════════════════════════════════════════════════════
#  AUTH VIEWS — Connexion / Inscription / Déconnexion
# ══════════════════════════════════════════════════════════════

class RegisterView(APIView):
    """
    POST /api/auth/register/
    Crée un nouveau compte utilisateur
    AllowAny = pas besoin d'être connecté pour s'inscrire
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Génère les tokens JWT pour connecter l'utilisateur directement
            refresh = RefreshToken.for_user(user)

            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UserSerializers(user).data
            }, status=status.HTTP_201_CREATED)

        # Si les données sont invalides, renvoie les erreurs à React
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Connexion avec email + mot de passe
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        # Cherche l'utilisateur par email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérifie le mot de passe
        if not user.check_password(password):
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérifie que le compte est actif
        if not user.is_active:
            return Response(
                {'error': 'Compte désactivé'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Génère les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializers(user).data
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Invalide le refresh token (blacklist)
    Après ça, le token ne peut plus être utilisé
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            # blacklist() = met le token sur liste noire
            token.blacklist()
            return Response({'message': 'Déconnecté avec succès'})
        except Exception:
            return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    GET /api/auth/me/
    Retourne les infos de l'utilisateur connecté
    Appelée par AuthContext au démarrage de React pour vérifier le token
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user = l'utilisateur connecté (récupéré depuis le token JWT)
        return Response(UserSerializers(request.user).data)


# ══════════════════════════════════════════════════════════════
#  DASHBOARD VIEW
# ══════════════════════════════════════════════════════════════

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Retourne toutes les statistiques pour le tableau de bord
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        maintenant = timezone.now()
        debut_mois = maintenant.replace(day=1, hour=0, minute=0, second=0)

        # ── Statistiques clients ──────────────────────────
        total_clients   = Client.objects.count()
        prospects       = Client.objects.filter(statut='prospect').count()
        clients_actifs  = Client.objects.filter(statut='actif').count()
        clients_fideles = Client.objects.filter(statut='fidele').count()

        # ── Statistiques interactions ─────────────────────
        interactions_mois = Interaction.objects.filter(
            created_at__gte=debut_mois
        ).count()

        # ── Statistiques RDV ──────────────────────────────
        rdv_a_venir = RendezVous.objects.filter(
            date_debut__gte=maintenant,
            statut__in=['planifie', 'confirme']
        ).count()

        # ── Prochains RDV (5 maximum) ─────────────────────
        prochains_rdv = RendezVous.objects.filter(
            date_debut__gte=maintenant,
            statut__in=['planifie', 'confirme']
        ).select_related('client')[:5]
        # select_related = charge le client en même temps (1 seule requête SQL)

        # ── Dernières interactions (5 maximum) ───────────
        dernieres_interactions = Interaction.objects.select_related('client')[:5]

        return Response({
            'stats': {
                'clients': {
                    'total':    total_clients,
                    'prospects': prospects,
                    'actifs':   clients_actifs,
                    'fideles':  clients_fideles,
                },
                'interactions': {
                    'ce_mois': interactions_mois,
                    'total':   Interaction.objects.count(),
                },
                'rdv': {
                    'a_venir': rdv_a_venir,
                    'total':   RendezVous.objects.count(),
                }
            },
            'prochains_rdv':         RendezVousSerializer(prochains_rdv, many=True).data,
            'dernieres_interactions': InteractionSerializer(dernieres_interactions, many=True).data,
        })


# ══════════════════════════════════════════════════════════════
#  CLIENT VIEWS
# ══════════════════════════════════════════════════════════════

class ClientListView(generics.ListCreateAPIView):
    """
    GET  /api/clients/ → liste des clients
    POST /api/clients/ → créer un client

    generics.ListCreateAPIView = vue générique Django REST
    Elle gère automatiquement GET et POST
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # POST (création) → serializer complet
        # GET (liste)     → serializer léger
        if self.request.method == 'POST':
            return ClientDetailSerializer
        return clientListeSerializers

    def get_queryset(self):
        """
        Filtre les clients selon les paramètres de l'URL
        Ex: /api/clients/?search=jean&statut=actif
        """
        queryset = Client.objects.all()
        search  = self.request.query_params.get('search')
        statut  = self.request.query_params.get('statut')

        if search:
            # Q() = permet de faire des OU dans les filtres
            # nom OU prenom OU email OU code contient "search"
            queryset = queryset.filter(
                Q(nom__icontains=search)    |
                Q(prenom__icontains=search) |
                Q(email__icontains=search)  |
                Q(code__icontains=search)
            )

        if statut and statut != 'tous':
            queryset = queryset.filter(statut=statut)

        return queryset


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/clients/42/ → fiche complète du client 42
    PUT    /api/clients/42/ → modifier le client 42
    DELETE /api/clients/42/ → supprimer le client 42

    RetrieveUpdateDestroyAPIView gère les 3 automatiquement
    """
    permission_classes  = [IsAuthenticated]
    serializer_class    = ClientDetailSerializer
    queryset            = Client.objects.all()


class ClientHistoriqueView(generics.ListAPIView):
    """
    GET /api/clients/42/historique/
    Retourne l'historique des actions sur le client 42
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = HistoriqueClientSerializer

    def get_queryset(self):
        # self.kwargs['pk'] = le 42 dans l'URL /api/clients/42/historique/
        return HistoriqueClient.objects.filter(client_id=self.kwargs['pk'])


# ══════════════════════════════════════════════════════════════
#  INTERACTION VIEWS
# ══════════════════════════════════════════════════════════════

class InteractionListView(generics.ListCreateAPIView):
    """
    GET  /api/interactions/       → toutes les interactions
    POST /api/interactions/       → créer une interaction
    GET  /api/interactions/?client=42 → interactions du client 42
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = InteractionSerializer

    def get_queryset(self):
        queryset  = Interaction.objects.select_related('client', 'responsable')
        client_id = self.request.query_params.get('client')
        search    = self.request.query_params.get('search')
        type_i    = self.request.query_params.get('type')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if search:
            queryset = queryset.filter(
                Q(sujet__icontains=search) |
                Q(client__nom__icontains=search)
            )
        if type_i:
            queryset = queryset.filter(type_interaction=type_i)

        return queryset

    def perform_create(self, serializer):
        """
        perform_create() = appelée après validation, avant sauvegarde
        On ajoute automatiquement le responsable = utilisateur connecté
        """
        interaction = serializer.save(responsable=self.request.user)

        # Enregistre dans l'historique du client
        HistoriqueClient.objects.create(
            client=interaction.client,
            utilisateur=self.request.user,
            action=f"Interaction ajoutée : {interaction.sujet}"
        )


class InteractionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/interactions/5/ → détail de l'interaction 5
    PUT    /api/interactions/5/ → modifier
    DELETE /api/interactions/5/ → supprimer
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = InteractionSerializer
    queryset           = Interaction.objects.all()


# ══════════════════════════════════════════════════════════════
#  RENDEZ-VOUS VIEWS
# ══════════════════════════════════════════════════════════════

class RendezVousListView(generics.ListCreateAPIView):
    """
    GET  /api/rendez-vous/          → tous les RDV
    POST /api/rendez-vous/          → créer un RDV
    GET  /api/rendez-vous/?a_venir=true → RDV à venir uniquement
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = RendezVousSerializer

    def get_queryset(self):
        queryset  = RendezVous.objects.select_related('client', 'responsable')
        client_id = self.request.query_params.get('client')
        statut    = self.request.query_params.get('statut')
        a_venir   = self.request.query_params.get('a_venir')

        if client_id:
            queryset = queryset.filter(client_id=client_id)

        if statut:
            queryset = queryset.filter(statut=statut)

        if a_venir == 'true':
            # Filtre les RDV dont la date est dans le futur
            queryset = queryset.filter(
                date_debut__gte=timezone.now(),
                statut__in=['planifie', 'confirme']
            )

        return queryset

    def perform_create(self, serializer):
        rdv = serializer.save(responsable=self.request.user)
        HistoriqueClient.objects.create(
            client=rdv.client,
            utilisateur=self.request.user,
            action=f"RDV créé : {rdv.titre} le {rdv.date_debut.strftime('%d/%m/%Y')}"
        )


class RendezVousDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = RendezVousSerializer
    queryset           = RendezVous.objects.all()


class NotifierRdvView(APIView):
    """
    POST /api/rendez-vous/42/notifier/
    Envoie manuellement un rappel email+SMS pour le RDV 42
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            rdv = RendezVous.objects.get(pk=pk)
        except RendezVous.DoesNotExist:
            return Response({'error': 'RDV introuvable'}, status=404)

        # Import ici pour éviter les imports circulaires
        from .notifications import envoyer_rappel_rdv
        succes = envoyer_rappel_rdv(rdv)

        if succes:
            rdv.notification_envoyee = True
            rdv.save()
            return Response({'message': 'Rappel envoyé avec succès'})
        else:
            return Response({'error': "Échec de l'envoi"}, status=500)


# ══════════════════════════════════════════════════════════════
#  PRESTATION VIEWS
# ══════════════════════════════════════════════════════════════

class PrestationListView(generics.ListCreateAPIView):
    """
    GET  /api/prestations/          → toutes les prestations
    POST /api/prestations/          → créer une prestation
    GET  /api/prestations/?client=42 → prestations du client 42
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = PrestationSerializer

    def get_queryset(self):
        queryset  = Prestation.objects.select_related('client', 'responsable')
        client_id = self.request.query_params.get('client')
        statut    = self.request.query_params.get('statut')
        search    = self.request.query_params.get('search')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if statut:
            queryset = queryset.filter(statut=statut)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(client__nom__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        prestation = serializer.save(responsable=self.request.user)
        HistoriqueClient.objects.create(
            client=prestation.client,
            utilisateur=self.request.user,
            action=f"Prestation ajoutée : {prestation.nom} — {prestation.prix_final}€"
        )


class PrestationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = PrestationSerializer
    queryset           = Prestation.objects.all()


# ══════════════════════════════════════════════════════════════
#  MESSAGE FIDELISATION VIEWS
# ══════════════════════════════════════════════════════════════

class MessageFidelisationListView(generics.ListCreateAPIView):
    """
    GET  /api/fidelisation/    → tous les messages envoyés
    POST /api/fidelisation/    → envoyer un nouveau message
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = MessageFidelisationSerializer

    def get_queryset(self):
        queryset  = MessageFidelisation.objects.select_related('client')
        client_id = self.request.query_params.get('client')
        canal     = self.request.query_params.get('canal')

        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if canal:
            queryset = queryset.filter(canal=canal)
        return queryset

    def perform_create(self, serializer):
        """
        Après validation du formulaire React :
        1. Sauvegarde le message en base
        2. L'envoie via le bon canal (email/sms/whatsapp)
        """
        from .notifications import envoyer_message_fidelisation
        message = serializer.save()
        envoyer_message_fidelisation(message)


class MessageFidelisationDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = MessageFidelisationSerializer
    queryset           = MessageFidelisation.objects.all()


# ══════════════════════════════════════════════════════════════
#  CAMPAGNE VIEWS
# ══════════════════════════════════════════════════════════════

class CampagneListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = CampagneSerializer
    queryset           = Campagne.objects.all()


class CampagneDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = CampagneSerializer
    queryset           = Campagne.objects.all()


class ExecuterCampagneView(APIView):
    """
    POST /api/campagnes/42/executer/
    Exécute manuellement la campagne 42
    Envoie les emails à tous les clients ciblés
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            campagne = Campagne.objects.get(pk=pk)
        except Campagne.DoesNotExist:
            return Response({'error': 'Campagne introuvable'}, status=404)

        from .tasks import executer_campagne
        # delay() = exécute la tâche en arrière-plan via Celery
        # L'utilisateur n'attend pas — la réponse est immédiate
        executer_campagne.delay(campagne.id)

        return Response({'message': f'Campagne "{campagne.nom}" lancée en arrière-plan'})


class ExecuterToutesCampagnesView(APIView):
    """
    POST /api/campagnes/executer-toutes/
    Exécute toutes les campagnes actives
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        campagnes = Campagne.objects.filter(statut='active')

        from .tasks import executer_campagne
        for campagne in campagnes:
            executer_campagne.delay(campagne.id)

        return Response({
            'message': f'{campagnes.count()} campagne(s) lancée(s) en arrière-plan'
        })


# ══════════════════════════════════════════════════════════════
#  PDF FICHE CLIENT
# ══════════════════════════════════════════════════════════════

class ClientPDFView(APIView):
    """
    GET /api/clients/42/pdf/
    Génère et télécharge la fiche PDF complète du client 42
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            client = Client.objects.get(pk=pk)
        except Client.DoesNotExist:
            return Response({'error': 'Client introuvable'}, status=404)

        from .pdf_generator import generer_fiche_client_pdf
        return generer_fiche_client_pdf(client)