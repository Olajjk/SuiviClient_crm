# ─────────────────────────────────────────────────────────────
#  serializers.py — Conversion Python ↔ JSON
#  Un serializer = un traducteur entre Django et React
#
#  Django (Python) ──serializer──▶ JSON ──▶ React
#  React (JSON)    ──serializer──▶ Python ──▶ Django
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Client, Interaction, RendezVous,
    MessageFidelisation, Campagne,
    Prestation, HistoriqueClient
)

# get_user_model() = récupère notre modèle User personnalisé
User = get_user_model()


#  USER SERIALIZERS


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer de base pour afficher un utilisateur
    Utilisé dans les réponses API (ex: info du responsable d'un client)
    """
    class Meta:
        model  = User
        # On liste les champs à exposer — jamais le mot de passe !
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'phone']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création d'un compte
    Reçoit les données du formulaire d'inscription React
    """
    # write_only=True = ce champ est reçu mais jamais renvoyé dans la réponse
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'email', 'password', 'password2']

    def validate(self, data):
        """
        validate() = appelée automatiquement pour vérifier les données
        Si on lève une ValidationError, Django renvoie une erreur 400 à React
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Les mots de passe ne correspondent pas'})
        return data

    def create(self, validated_data):
        """
        create() = appelée quand on sauvegarde le serializer
        On retire password2 car le modèle User ne l'a pas
        """
        validated_data.pop('password2')
        # create_user() hash le mot de passe automatiquement
        return User.objects.create_user(**validated_data)


# ══════════════════════════════════════════════════════════════
#  CLIENT SERIALIZERS
# ══════════════════════════════════════════════════════════════

class ClientListSerializer(serializers.ModelSerializer):
    """
    Serializer LÉGER pour la liste des clients
    N'envoie que les infos nécessaires (pas tout)
    → utilisé quand React charge la liste /api/clients/
    """
    # SerializerMethodField = champ calculé, pas dans le modèle
    nb_interactions = serializers.SerializerMethodField()
    responsable_nom = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = [
            'id', 'code', 'nom', 'prenom', 'email',
            'telephone', 'ville', 'statut',
            'nb_interactions', 'responsable_nom',
            'date_creation'
        ]

    def get_nb_interactions(self, obj):
        # obj = l'objet Client en cours de sérialisation
        # obj.interactions.count() = nombre d'interactions de ce client
        return obj.interactions.count()

    def get_responsable_nom(self, obj):
        # Retourne le nom du responsable ou None s'il n'y en a pas
        if obj.responsable:
            return obj.responsable.get_full_name()
        return None


class ClientDetailSerializer(serializers.ModelSerializer):
    """
    Serializer COMPLET pour la fiche client
    Inclut TOUT : interactions, RDV, prestations...
    → utilisé quand React charge /api/clients/42/
    """
    # Ces champs sont des serializers imbriqués (nested)
    # many=True = liste d'objets
    # read_only=True = affichage uniquement, pas de modification

    responsable     = UserSerializer(read_only=True)
    responsable_id  = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='responsable',
        write_only=True, required=False, allow_null=True
    )
    nb_interactions = serializers.SerializerMethodField()
    montant_total   = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = [
            'id', 'code', 'nom', 'prenom', 'email', 'telephone',
            'adresse', 'ville', 'statut', 'notes',
            'responsable', 'responsable_id',
            'nb_interactions', 'montant_total',
            'date_creation', 'date_modification',
        ]

    def get_nb_interactions(self, obj):
        return obj.interactions.count()

    def get_montant_total(self, obj):
        """Somme de toutes les prestations terminées du client"""
        from django.db.models import Sum
        total = obj.prestations.filter(statut='termine').aggregate(
            total=Sum('prix_final')
        )['total']
        # Si aucune prestation, retourne 0
        return float(total) if total else 0


# ══════════════════════════════════════════════════════════════
#  INTERACTION SERIALIZER
# ══════════════════════════════════════════════════════════════

class InteractionSerializer(serializers.ModelSerializer):
    """
    Pour créer, modifier, lister et voir les interactions
    """
    # Champs en lecture seule — affichés dans la liste
    client_nom      = serializers.CharField(source='client.nom', read_only=True)
    responsable_nom = serializers.SerializerMethodField()

    # Champs en écriture — pour créer/modifier via React
    client      = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    responsable = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model  = Interaction
        fields = [
            'id', 'client', 'client_nom',
            'responsable', 'responsable_nom',
            'type_interaction', 'statut',
            'date', 'sujet', 'description',
            'created_at'
        ]

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return obj.responsable.get_full_name()
        return None


# ══════════════════════════════════════════════════════════════
#  RENDEZ-VOUS SERIALIZER
# ══════════════════════════════════════════════════════════════

class RendezVousSerializer(serializers.ModelSerializer):
    client_nom      = serializers.CharField(source='client.nom',       read_only=True)
    client_prenom   = serializers.CharField(source='client.prenom',    read_only=True)
    client_code     = serializers.CharField(source='client.code',      read_only=True)
    client_tel      = serializers.CharField(source='client.telephone', read_only=True)
    responsable_nom = serializers.SerializerMethodField()

    client      = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    responsable = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model  = RendezVous
        fields = [
            'id', 'client', 'client_nom', 'client_prenom', 'client_code', 'client_tel',
            'responsable', 'responsable_nom',
            'titre', 'description', 'lieu',
            'date_debut', 'date_fin',
            'statut', 'notification_envoyee',
            'created_at'
        ]

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return obj.responsable.get_full_name()
        return None

    def validate(self, data):
        """Vérifie que la date de fin est après la date de début"""
        if data.get('date_fin') and data.get('date_debut'):
            if data['date_fin'] <= data['date_debut']:
                raise serializers.ValidationError({
                    'date_fin': 'La date de fin doit être après la date de début'
                })
        return data


# ══════════════════════════════════════════════════════════════
#  PRESTATION SERIALIZER
# ══════════════════════════════════════════════════════════════

class PrestationSerializer(serializers.ModelSerializer):
    client_nom      = serializers.CharField(source='client.nom', read_only=True)
    responsable_nom = serializers.SerializerMethodField()
    montant_remise  = serializers.SerializerMethodField()

    client      = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    responsable = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model  = Prestation
        fields = [
            'id', 'client', 'client_nom',
            'responsable', 'responsable_nom',
            'nom', 'description',
            'prix', 'reduction', 'prix_final', 'montant_remise',
            'date_realisation', 'statut', 'notes',
            'created_at'
        ]
        # prix_final est calculé automatiquement dans models.save()
        # read_only = React ne peut pas le modifier directement
        read_only_fields = ['prix_final']

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return obj.responsable.get_full_name()
        return None

    def get_montant_remise(self, obj):
        """Montant économisé : prix - prix_final"""
        return float(obj.prix - obj.prix_final)


# ══════════════════════════════════════════════════════════════
#  MESSAGE FIDELISATION SERIALIZER
# ══════════════════════════════════════════════════════════════

class MessageFidelisationSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client     = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())

    class Meta:
        model  = MessageFidelisation
        fields = [
            'id', 'client', 'client_nom',
            'type_message', 'canal',
            'sujet', 'contenu',
            'envoye_le', 'auto',
            'succes', 'erreur'
        ]
        # Ces champs sont remplis automatiquement par le système
        read_only_fields = ['envoye_le', 'succes', 'erreur', 'auto']


# ══════════════════════════════════════════════════════════════
#  CAMPAGNE SERIALIZER
# ══════════════════════════════════════════════════════════════

class CampagneSerializer(serializers.ModelSerializer):
    """
    Pour créer et gérer les campagnes d'emailing
    nb_envois_total et derniere_execution sont mis à jour
    automatiquement par Celery quand la campagne est exécutée
    """
    class Meta:
        model  = Campagne
        fields = [
            'id', 'nom', 'type_campagne',
            'sujet', 'contenu', 'statut',
            'seuil_interactions', 'jours_inactivite',
            'nb_envois_total', 'derniere_execution',
            'created_at'
        ]
        read_only_fields = ['nb_envois_total', 'derniere_execution']


# ══════════════════════════════════════════════════════════════
#  HISTORIQUE CLIENT SERIALIZER
# ══════════════════════════════════════════════════════════════

class HistoriqueClientSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model  = HistoriqueClient
        fields = ['id', 'action', 'utilisateur_nom', 'created_at']

    def get_utilisateur_nom(self, obj):
        if obj.utilisateur:
            return obj.utilisateur.get_full_name()
        return 'Système'  # si c'est une action automatique
    
    
# ─────────────────────────────────────────────────────────────
#  À AJOUTER dans serializers.py
# ─────────────────────────────────────────────────────────────

class ProfilSerializer(serializers.ModelSerializer):
    """Modifier ses propres infos (prénom, nom, téléphone, mot de passe)"""

    # Pour changer le mot de passe — optionnel
    ancien_password  = serializers.CharField(write_only=True, required=False)
    nouveau_password = serializers.CharField(write_only=True, required=False, min_length=8)

    # avatar_url = URL complète de l'image (ex: http://localhost:8000/media/avatars/...)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'phone', 'role', 'avatar_url',
            'ancien_password', 'nouveau_password'
        ]
        read_only_fields = ['email', 'role']  # ne peut pas changer son email/rôle

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                # build_absolute_uri = donne l'URL complète avec http://...
                return request.build_absolute_uri(obj.avatar.url)
        return None

    def validate(self, data):
        # Si l'utilisateur veut changer de mot de passe
        if data.get('nouveau_password'):
            if not data.get('ancien_password'):
                raise serializers.ValidationError({
                    'ancien_password': 'Entrez votre ancien mot de passe'
                })
            # Vérifie que l'ancien mot de passe est correct
            if not self.instance.check_password(data['ancien_password']):
                raise serializers.ValidationError({
                    'ancien_password': 'Mot de passe incorrect'
                })
        return data

    def update(self, instance, validated_data):
        # Retire les champs mot de passe avant de sauvegarder
        ancien  = validated_data.pop('ancien_password',  None)
        nouveau = validated_data.pop('nouveau_password', None)

        # Met à jour les autres champs normalement
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Change le mot de passe si fourni
        if nouveau:
            instance.set_password(nouveau)

        instance.save()
        return instance