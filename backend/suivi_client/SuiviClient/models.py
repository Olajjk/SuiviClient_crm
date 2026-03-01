from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('responsable', 'Responsable Client'),
        ('user', 'Utilisateur'),
    ]
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='responsable')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    
    
class Client(models.Moedl):
    code= models.UUIDField()
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(max_length=50,unique=True)
    adresse = models.CharField(max_length=50)
    entreprise = models.CharField(max_length=50)
    created_at = models.DateTimeField(max_length=50)
    created_by = models.CharField(max_length=50)
     def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
        
            
class RendezVous(models.Model):
    STATUT_CHOICES = [
        ('planifie', 'Planifié'),
        ('confirme', 'Confirmé'),
        ('effectue', 'Effectué'),
        ('annule', 'Annulé'),
        ('reporte', 'Reporté'),
    ]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='rendez_vous')
    responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rendez_vous')
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    lieu = models.CharField(max_length=200, blank=True, default='')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='planifie')
    notification_envoyee = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Rendez-vous'
        ordering = ['date_debut']

    def __str__(self):
        return f"{self.titre} - {self.client}"
            
class MessageFidelisation(models.Model):
        def __str__():
            None
            
            
            
class Interaction(models.Model):
        def __str__(self):
            None

class HistoriqueClient(models.Model):
    def __str__(self):
        return None