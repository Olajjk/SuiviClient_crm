# ─────────────────────────────────────────────────────────────
#  notifications.py — Envoi Email / SMS / WhatsApp
#  Toutes les fonctions d'envoi sont ici
#  Appelées depuis views.py (manuel) et tasks.py (automatique)
# ─────────────────────────────────────────────────────────────

import logging
from django.conf import settings
from django.utils import timezone

# logger = enregistre les erreurs dans la console/fichier log
# Evite que le programme plante si un envoi échoue
logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════
#  UTILITAIRE — Remplacement des variables dans les templates
# ══════════════════════════════════════════════════════════════

def remplacer_variables(texte, client):
    """
    Remplace les variables {{nom}}, {{prenom}} etc. par les vraies valeurs
    Utilisé pour personnaliser chaque message

    Exemple :
    texte   = "Bonjour {{nom}}, votre RDV est confirmé"
    résultat = "Bonjour Dupont, votre RDV est confirmé"
    """
    return (texte
        .replace('{{nom}}',    client.nom)
        .replace('{{prenom}}', client.prenom or '')
        .replace('{{code}}',   client.code)
        .replace('{{ville}}',  client.ville or '')
        .replace('{{email}}',  client.email or '')
        .replace('{{tel}}',    client.telephone or '')
    )


# ══════════════════════════════════════════════════════════════
#  EMAIL via SendGrid
# ══════════════════════════════════════════════════════════════

def envoyer_email(destinataire_email, sujet, contenu_html):
    """
    Envoie un email via l'API SendGrid
    Retourne True si succès, False si erreur

    Paramètres :
    - destinataire_email : "jean@gmail.com"
    - sujet              : "Rappel de votre rendez-vous"
    - contenu_html       : "<p>Bonjour Jean...</p>"
    """
    if not destinataire_email:
        logger.warning("Email non envoyé : pas d'adresse email")
        return False

    if not settings.SENDGRID_API_KEY:
        logger.warning("Email non envoyé : SENDGRID_API_KEY manquant dans .env")
        return False

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        # Crée le message
        message = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=destinataire_email,
            subject=sujet,
            html_content=contenu_html
        )

        # Envoie via l'API SendGrid
        sg       = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        response = sg.send(message)

        # Les codes 2xx = succès (200, 201, 202)
        if response.status_code in [200, 201, 202]:
            logger.info(f"Email envoyé à {destinataire_email}")
            return True
        else:
            logger.error(f"Erreur SendGrid : {response.status_code}")
            return False

    except Exception as e:
        logger.error(f"Erreur envoi email : {e}")
        return False


# ══════════════════════════════════════════════════════════════
#  SMS via Africa's Talking
# ══════════════════════════════════════════════════════════════

def envoyer_sms(numero_telephone, message):
    """
    Envoie un SMS via Africa's Talking
    Parfait pour les numéros béninois (+229...)
    Retourne True si succès, False si erreur

    Paramètres :
    - numero_telephone : "+22961234567"
    - message          : "Rappel RDV demain à 10h"
    """
    if not numero_telephone:
        logger.warning("SMS non envoyé : pas de numéro de téléphone")
        return False

    if not settings.AFRICASTALKING_API_KEY:
        logger.warning("SMS non envoyé : AFRICASTALKING_API_KEY manquant dans .env")
        return False

    try:
        import africastalking

        # Initialise le SDK Africa's Talking
        africastalking.initialize(
            username=settings.AFRICASTALKING_USERNAME,
            api_key=settings.AFRICASTALKING_API_KEY
        )

        # Récupère le service SMS
        sms = africastalking.SMS

        # Envoie le SMS
        # recipients doit être une liste
        response = sms.send(message, [numero_telephone])

        # Vérifie si l'envoi a réussi
        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        if recipients and recipients[0].get('status') == 'Success':
            logger.info(f"SMS envoyé à {numero_telephone}")
            return True
        else:
            logger.error(f"Erreur SMS : {response}")
            return False

    except Exception as e:
        logger.error(f"Erreur envoi SMS : {e}")
        return False


# ══════════════════════════════════════════════════════════════
#  WHATSAPP via CallMeBot (gratuit)
#  Inscription sur : https://www.callmebot.com/blog/free-api-whatsapp-messages/
# ══════════════════════════════════════════════════════════════

def envoyer_whatsapp(numero_telephone, message):
    """
    Envoie un message WhatsApp via CallMeBot
    GRATUIT — pas besoin de compte professionnel Meta
    Retourne True si succès, False si erreur

    IMPORTANT : le client doit d'abord envoyer
    "I allow callmebot to send me messages" à +34 644 44 31 48
    sur WhatsApp pour activer le service

    Paramètres :
    - numero_telephone : "22961234567" (sans le +)
    - message          : "Bonjour Jean, votre RDV est demain"
    """
    if not numero_telephone:
        logger.warning("WhatsApp non envoyé : pas de numéro")
        return False

    if not settings.CALLMEBOT_API_KEY:
        logger.warning("WhatsApp non envoyé : CALLMEBOT_API_KEY manquant dans .env")
        return False

    try:
        import requests
        from urllib.parse import quote

        # Encode le message pour l'URL (espaces → %20 etc.)
        message_encode = quote(message)

        # Supprime le + si présent dans le numéro
        numero = numero_telephone.replace('+', '').replace(' ', '')

        # URL de l'API CallMeBot
        url = (
            f"https://api.callmebot.com/whatsapp.php"
            f"?phone={numero}"
            f"&text={message_encode}"
            f"&apikey={settings.CALLMEBOT_API_KEY}"
        )

        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            logger.info(f"WhatsApp envoyé à {numero_telephone}")
            return True
        else:
            logger.error(f"Erreur WhatsApp : {response.status_code} — {response.text}")
            return False

    except Exception as e:
        logger.error(f"Erreur envoi WhatsApp : {e}")
        return False


# ══════════════════════════════════════════════════════════════
#  RAPPEL RDV — Email + SMS ensemble
#  Appelée depuis views.py (bouton "Notifier") et tasks.py (auto)
# ══════════════════════════════════════════════════════════════

def envoyer_rappel_rdv(rdv):
    """
    Envoie un rappel de rendez-vous au client
    via Email ET SMS en même temps
    Retourne True si au moins un envoi a réussi
    """
    client = rdv.client
    date   = rdv.date_debut.strftime('%d/%m/%Y à %Hh%M')

    # ── Contenu de l'email ────────────────────────────────
    sujet_email = f"Rappel : {rdv.titre} — {date}"
    contenu_email = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Rappel de rendez-vous</h2>
        <p>Bonjour <strong>{client.nom} {client.prenom}</strong>,</p>
        <p>Nous vous rappelons votre rendez-vous :</p>
        <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>📋 Objet :</strong> {rdv.titre}</p>
            <p><strong>📅 Date :</strong> {date}</p>
            <p><strong>📍 Lieu :</strong> {rdv.lieu or 'À définir'}</p>
        </div>
        <p>En cas d'empêchement, merci de nous contacter rapidement.</p>
        <p>Cordialement,<br><strong>SuiviClient CRM</strong></p>
    </div>
    """

    # ── Contenu du SMS (court — max 160 caractères) ───────
    contenu_sms = (
        f"Rappel RDV : {rdv.titre}\n"
        f"Le {date}\n"
        f"Lieu : {rdv.lieu or 'à définir'}\n"
        f"SuiviClient"
    )

    # ── Envoi ─────────────────────────────────────────────
    succes_email = envoyer_email(client.email, sujet_email, contenu_email)
    succes_sms   = envoyer_sms(client.telephone, contenu_sms)

    # Enregistre dans l'historique
    from .models import HistoriqueClient
    HistoriqueClient.objects.create(
        client=client,
        utilisateur=None,  # None = action du système
        action=f"Rappel RDV envoyé : {rdv.titre} ({date})"
    )

    # Retourne True si au moins un envoi a réussi
    return succes_email or succes_sms


# ══════════════════════════════════════════════════════════════
#  MESSAGE FIDELISATION — Email / SMS / WhatsApp
#  Appelée depuis views.py quand on clique "Envoyer"
# ══════════════════════════════════════════════════════════════

def envoyer_message_fidelisation(message):
    """
    Envoie un message de fidélisation via le bon canal
    Met à jour le champ succes/erreur du message
    """
    client  = message.client
    contenu = remplacer_variables(message.contenu, client)
    succes  = False
    erreur  = ''

    try:
        if message.canal == 'email':
            sujet  = remplacer_variables(message.sujet, client)
            # Enveloppe le texte dans un HTML simple
            html   = f"<div style='font-family:Arial'>{contenu.replace(chr(10), '<br>')}</div>"
            succes = envoyer_email(client.email, sujet, html)
            if not succes:
                erreur = "Échec envoi email"

        elif message.canal == 'sms':
            succes = envoyer_sms(client.telephone, contenu)
            if not succes:
                erreur = "Échec envoi SMS"

        elif message.canal == 'whatsapp':
            succes = envoyer_whatsapp(client.telephone, contenu)
            if not succes:
                erreur = "Échec envoi WhatsApp"

    except Exception as e:
        erreur = str(e)
        logger.error(f"Erreur envoi fidélisation : {e}")

    # Met à jour le statut d'envoi dans la base de données
    message.succes = succes
    message.erreur = erreur
    message.save(update_fields=['succes', 'erreur'])

    return succes


# ══════════════════════════════════════════════════════════════
#  CAMPAGNE EMAIL — Envoi groupé
#  Appelée depuis tasks.py (auto) ou views.py (manuel)
# ══════════════════════════════════════════════════════════════

def executer_campagne_envoi(campagne):
    """
    Exécute une campagne — envoie l'email à tous les clients ciblés
    Retourne le nombre d'emails envoyés avec succès
    """
    from .models import Client, MessageFidelisation
    from django.db.models import Count
    from django.utils import timezone

    # ── Sélectionne les clients selon le type de campagne ──
    if campagne.type_campagne == 'promotion':
        # Clients actifs ou fidèles avec assez d'interactions
        clients = Client.objects.filter(
            statut__in=['actif', 'fidele'],
            email__gt=''  # email non vide
        ).annotate(
            nb=Count('interactions')
        ).filter(nb__gte=campagne.seuil_interactions)

    elif campagne.type_campagne == 'relance':
        # Clients sans interaction depuis X jours
        date_limite = timezone.now() - timezone.timedelta(days=campagne.jours_inactivite)
        clients = Client.objects.filter(
            email__gt=''
        ).exclude(
            interactions__created_at__gte=date_limite
        ).distinct()

    else:
        # nouveaute → tous les clients avec un email
        clients = Client.objects.filter(email__gt='')

    # ── Envoie l'email à chaque client ────────────────────
    nb_succes = 0
    for client in clients:
        sujet   = remplacer_variables(campagne.sujet,   client)
        contenu = remplacer_variables(campagne.contenu, client)
        html    = f"<div style='font-family:Arial'>{contenu.replace(chr(10), '<br>')}</div>"

        succes = envoyer_email(client.email, sujet, html)

        # Enregistre chaque envoi dans MessageFidelisation
        MessageFidelisation.objects.create(
            client=client,
            type_message='promotion' if campagne.type_campagne == 'promotion' else 'relance',
            canal='email',
            sujet=sujet,
            contenu=contenu,
            auto=True,   # envoyé automatiquement par le système
            succes=succes,
            erreur='' if succes else 'Échec envoi'
        )

        if succes:
            nb_succes += 1

    # Met à jour les statistiques de la campagne
    campagne.nb_envois_total    += nb_succes
    campagne.derniere_execution  = timezone.now()
    campagne.save(update_fields=['nb_envois_total', 'derniere_execution'])

    logger.info(f"Campagne '{campagne.nom}' : {nb_succes}/{clients.count()} envois réussis")
    return nb_succes