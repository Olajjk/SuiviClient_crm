# ─────────────────────────────────────────────────────────────
#  models.py — Tous les modèles de la base de données
#  Un modèle = une table dans la base de données
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin


# ══════════════════════════════════════════════════════════════
#  USER — Utilisateur de l'application
# ══════════════════════════════════════════════════════════════

class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email est obligatoire')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)   # hash le mot de passe
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Utilisateur personnalisé — connexion par email
    AbstractBaseUser = classe de base Django pour les utilisateurs
    PermissionsMixin = ajoute is_staff, is_superuser, permissions
    """
    ROLE_CHOICES = [
        ('admin',       'Administrateur'),
        ('responsable', 'Responsable Client'),
        ('user',        'Utilisateur'),
    ]

    first_name = models.CharField(max_length=50)
    last_name  = models.CharField(max_length=50)
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='responsable')
    phone      = models.CharField(max_length=20, blank=True, default='')
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'       # on se connecte avec l'email
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


# ══════════════════════════════════════════════════════════════
#  CLIENT
# ══════════════════════════════════════════════════════════════

class Client(models.Model):
    STATUT_CHOICES = [
        ('prospect', 'Prospect'),
        ('actif',    'Actif'),
        ('inactif',  'Inactif'),
        ('fidele',   'Fidèle'),
    ]

    code        = models.CharField(max_length=20, unique=True, blank=True)
    nom         = models.CharField(max_length=100)
    prenom      = models.CharField(max_length=100, blank=True, default='')
    email       = models.EmailField(blank=True, default='')
    telephone   = models.CharField(max_length=20, blank=True, default='')
    adresse     = models.TextField(blank=True, default='')
    ville       = models.CharField(max_length=100, blank=True, default='')
    statut      = models.CharField(max_length=20, choices=STATUT_CHOICES, default='prospect')
    notes       = models.TextField(blank=True, default='')

    # ForeignKey = lien vers User
    # SET_NULL = si le responsable est supprimé, le client reste
    responsable = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='clients'
    )

    date_creation     = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Client'
        ordering     = ['-date_creation']

    def __str__(self):
        return f"{self.nom} {self.prenom}".strip()

    def save(self, *args, **kwargs):
        # Génère le code CLI-XXXXXX automatiquement
        if not self.code:
            import random, string
            self.code = 'CLI-' + ''.join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)

    @property
    def nb_interactions(self):
        """Nombre total d'interactions — accessible via client.nb_interactions"""
        return self.interactions.count()


# ══════════════════════════════════════════════════════════════
#  INTERACTION
#  Chaque contact avec un client : appel, email, réunion...
# ══════════════════════════════════════════════════════════════

class Interaction(models.Model):
    TYPE_CHOICES = [
        ('appel',    'Appel téléphonique'),
        ('email',    'Email'),
        ('reunion',  'Réunion'),
        ('visite',   'Visite'),
        ('sms',      'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('autre',    'Autre'),
    ]
    STATUT_CHOICES = [
        ('planifie', 'Planifié'),
        ('effectue', 'Effectué'),
        ('annule',   'Annulé'),
    ]

    # CASCADE = si le client est supprimé, ses interactions le sont aussi
    client           = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='interactions')
    responsable      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    type_interaction = models.CharField(max_length=20, choices=TYPE_CHOICES, default='appel')
    statut           = models.CharField(max_length=20, choices=STATUT_CHOICES, default='effectue')
    date             = models.DateTimeField()
    sujet            = models.CharField(max_length=200)
    description      = models.TextField(blank=True, default='')
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Interaction'
        ordering     = ['-date']

    def __str__(self):
        return f"{self.type_interaction} — {self.client} — {self.sujet}"


# ══════════════════════════════════════════════════════════════
#  RENDEZ-VOUS
# ══════════════════════════════════════════════════════════════

class RendezVous(models.Model):
    STATUT_CHOICES = [
        ('planifie', 'Planifié'),
        ('confirme', 'Confirmé'),
        ('effectue', 'Effectué'),
        ('annule',   'Annulé'),
        ('reporte',  'Reporté'),
    ]

    client       = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='rendez_vous')
    responsable  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rendez_vous')
    titre        = models.CharField(max_length=200)
    description  = models.TextField(blank=True, default='')
    date_debut   = models.DateTimeField()
    date_fin     = models.DateTimeField()
    lieu         = models.CharField(max_length=200, blank=True, default='')
    statut       = models.CharField(max_length=20, choices=STATUT_CHOICES, default='planifie')

    # True quand le rappel a déjà été envoyé — évite les doublons
    notification_envoyee = models.BooleanField(default=False)

    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Rendez-vous'
        ordering     = ['date_debut']

    def __str__(self):
        return f"{self.titre} — {self.client}"


# ══════════════════════════════════════════════════════════════
#  MESSAGE FIDELISATION
#  Emails/SMS/WhatsApp envoyés pour fidéliser les clients
#  Peut être envoyé manuellement OU automatiquement par le système
# ══════════════════════════════════════════════════════════════

class MessageFidelisation(models.Model):
    TYPE_CHOICES = [
        ('anniversaire', 'Anniversaire'),
        ('promotion',    'Promotion'),
        ('relance',      'Relance'),
        ('remerciement', 'Remerciement'),
        ('nouveaute',    'Nouveauté'),
        ('autre',        'Autre'),
    ]
    CANAL_CHOICES = [
        ('email',    'Email'),
        ('sms',      'SMS'),
        ('whatsapp', 'WhatsApp'),
    ]

    client       = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='messages_fidelisation')
    type_message = models.CharField(max_length=20, choices=TYPE_CHOICES, default='remerciement')
    canal        = models.CharField(max_length=20, choices=CANAL_CHOICES, default='email')
    sujet        = models.CharField(max_length=200)
    contenu      = models.TextField()
    envoye_le    = models.DateTimeField(auto_now_add=True)

    # auto=True = envoyé par le système automatiquement
    # auto=False = envoyé manuellement par l'utilisateur
    auto         = models.BooleanField(default=False)

    # succes=True = l'envoi a réussi | False = il y a eu une erreur
    succes       = models.BooleanField(default=True)
    erreur       = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Message de fidélisation'
        ordering     = ['-envoye_le']

    def __str__(self):
        return f"{self.type_message} → {self.client} ({self.canal})"


# ══════════════════════════════════════════════════════════════
#  CAMPAGNE EMAIL
#  Envois automatiques groupés à un ensemble de clients
#  Le système les exécute chaque jour à 8h00
# ══════════════════════════════════════════════════════════════

class Campagne(models.Model):
    TYPE_CHOICES = [
        ('promotion', 'Promotion'),   # → clients actifs et fidèles
        ('relance',   'Relance'),     # → clients sans interaction récente
        ('nouveaute', 'Nouveautés'),  # → tous les clients
    ]
    STATUT_CHOICES = [
        ('active',   'Active'),    # exécutée automatiquement
        ('inactive', 'Inactive'), # jamais exécutée
    ]

    nom           = models.CharField(max_length=200)
    type_campagne = models.CharField(max_length=20, choices=TYPE_CHOICES)
    sujet         = models.CharField(max_length=200)
    contenu       = models.TextField()
    statut        = models.CharField(max_length=20, choices=STATUT_CHOICES, default='active')

    # Paramètre pour type=promotion
    # Ex: seuil=3 → cible les clients avec au moins 3 interactions
    seuil_interactions = models.IntegerField(default=3)

    # Paramètre pour type=relance
    # Ex: jours=60 → cible les clients sans interaction depuis 60 jours
    jours_inactivite   = models.IntegerField(default=60)

    # Statistiques
    nb_envois_total    = models.IntegerField(default=0)
    derniere_execution = models.DateTimeField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Campagne'
        ordering     = ['-created_at']

    def __str__(self):
        return f"{self.nom} ({self.type_campagne})"


# ══════════════════════════════════════════════════════════════
#  HISTORIQUE CLIENT
#  Enregistre automatiquement chaque action sur un client
# ══════════════════════════════════════════════════════════════

class HistoriqueClient(models.Model):
    client      = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='historique')
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # Ex: "Statut changé de prospect à actif"
    action      = models.CharField(max_length=200, default="Création du client")

    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Historique client'
        ordering     = ['-created_at']

    def __str__(self):
        return f"{self.client} — {self.action}"
    
    
    
    # ══════════════════════════════════════════════════════════════
#  MODÈLE PRESTATION — À ajouter à la fin de models.py
#  Représente un service rendu à un client
#  La réduction est calculée automatiquement selon les règles
# ══════════════════════════════════════════════════════════════

class Prestation(models.Model):
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('termine',  'Terminé'),
        ('annule',   'Annulé'),
    ]

    # Lien vers le client — CASCADE = supprimé si le client est supprimé
    client      = models.ForeignKey(
        Client, on_delete=models.CASCADE,
        related_name='prestations'
        # related_name permet : client.prestations.all()
    )

    # Lien vers le responsable qui a créé la prestation
    responsable = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='prestations'
    )

    nom         = models.CharField(max_length=200)       # Ex: "Audit comptable"
    description = models.TextField(blank=True, default='')

    # Prix AVANT réduction
    prix        = models.DecimalField(max_digits=10, decimal_places=2)
    # DecimalField = chiffres avec virgule, max_digits=10 → jusqu'à 99 999 999.99

    # Réduction en pourcentage : 0 à 100
    reduction   = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    # Ex: reduction=20 → 20% de réduction

    # Prix APRÈS réduction — calculé automatiquement dans save()
    prix_final  = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    date_realisation = models.DateField()
    statut      = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    notes       = models.TextField(blank=True, default='')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Prestation'
        ordering     = ['-date_realisation']

    def __str__(self):
        return f"{self.nom} — {self.client}"

    def save(self, *args, **kwargs):
        # Calcule le prix final automatiquement avant chaque sauvegarde
        # Formule : prix_final = prix × (1 - réduction/100)
        # Ex : 100€ avec 20% → 100 × (1 - 0.20) = 80€
        self.prix_final = self.prix * (1 - self.reduction / 100)
        super().save(*args, **kwargs)

    @property
    def montant_remise(self):
        """Montant économisé grâce à la réduction"""
        # Accessible via prestation.montant_remise
        return self.prix - self.prix_final