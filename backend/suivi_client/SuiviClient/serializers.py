from rest_framework import serializers
from .models import Client, Rendez_Vous, Interaction, MessageFidelisation

class ClientSerializers(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = all
        
        
class InteractionSerializers(serializers.ModelSerializer):
    class Meta:
        model = Interaction
        fields = all

class MessageFidelisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageFidelisation
        fields = all
        
class RendezVousSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rendez_Vous
        fields = all