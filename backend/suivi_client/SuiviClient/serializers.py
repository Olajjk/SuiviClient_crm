from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client, RendezVous, Interaction, MessageFidelisation
from .models import (
    Client, Interaction, RendezVous,
    MessageFidelisation, Campagne,
    Prestation, HistoriqueClient
)


User = get_user_model()

class  UserSerializers(serializers.ModelSerializer):
    class Meta:
        model = User
        # C'est la liste des champs qui seront affichés
        fields = ['id','fistname','lastname','email','phone','role']
        
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField()
    password2 = serializers.CharField()
    
    #  Ici nous allons essayer de creer le user et hasher le mot de passe 
    def create(self, validate_data):
        validate_data.pop('password2')
        return  User.objects.create_user(validate_data)        
      # Ici on va juste verifier qi les mots de passe correspondent   
    def validate(self, data):
        if ['password']!= ['password2']:
            raise serializers.ValidationError('Les mots de passe ne correspondent pas')
        return data
        

class ClientSerializers(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '_ _all_ _'
        

class clientListeSerializers(serializers.ModelSerializer):
    class Meta :
        model = Client
        fields = [
                  'id', 'code', 'nom', 'prenom', 'email',
            'telephone', 'ville', 'statut',
            'nb_interactions', 'responsable_nom',
            'date_creation']
        
    def get_nb_interactions(self, obj):
        return obj.interactions.count()
        
        return 
    def get_responsable_nom(self, obj):
        if obj.responsable :
         return obj.responsable.get_full_name()
    
        
  

class ClientDetailSerializer(serializers.ModelSerializer):
    # Ces champs sont des serializers imbriqués (nested)
    # many=True = liste d'objets
    # read_only=True = affichage uniquement, pas de modification

    responsable     = UserSerializers(read_only=True)
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
    client_nom      = serializers.CharField(source='client.nom', read_only=True)
    client_tel      = serializers.CharField(source='client.telephone', read_only=True)
    responsable_nom = serializers.SerializerMethodField()

    client      = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    responsable = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model  = RendezVous
        fields = [
            'id', 'client', 'client_nom', 'client_tel',
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


















