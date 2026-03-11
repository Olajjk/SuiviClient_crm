import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def formater_numero(numero):
    if not numero:
        return None
    numero = numero.replace(" ", "").replace("-", "")
    if numero.startswith("0"):
        numero = "+229" + numero[1:]
    if not numero.startswith("+"):
        numero = "+229" + numero
    return numero


def remplacer_variables(texte, client):
    return (texte
        .replace('{{nom}}',    client.nom)
        .replace('{{prenom}}', client.prenom or '')
        .replace('{{code}}',   client.code)
        .replace('{{ville}}',  client.ville or '')
        .replace('{{email}}',  client.email or '')
        .replace('{{tel}}',    client.telephone or '')
    )


def base_email(titre, contenu_principal, pied_de_page='SuiviClient CRM'):
    """
    Template email universel — élégant, sobre, compatible tous clients mail.
    Inspiré du style Notion / Linear.
    """
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titre}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Marque -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:13px;font-weight:600;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">SuiviClient</span>
            </td>
          </tr>

          <!-- Carte principale -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              {contenu_principal}
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">{pied_de_page}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def bloc_info(label, valeur):
    return f"""
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
        <span style="font-size:12px;color:#a1a1aa;display:block;margin-bottom:2px;">{label}</span>
        <span style="font-size:14px;color:#18181b;font-weight:500;">{valeur}</span>
      </td>
    </tr>"""


def envoyer_email(destinataire_email, sujet, contenu_html):
    if not destinataire_email:
        logger.warning("Email non envoyé : pas d'adresse email")
        return False
    if not settings.SENDGRID_API_KEY:
        logger.warning("SENDGRID_API_KEY manquant")
        return False
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, ReplyTo

        message = Mail(
            from_email=(settings.DEFAULT_FROM_EMAIL, 'SuiviClient CRM'),
            to_emails=destinataire_email,
            subject=sujet,
            html_content=contenu_html
        )
        message.reply_to = ReplyTo(settings.DEFAULT_FROM_EMAIL, 'SuiviClient CRM')

        sg = sendgrid.SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)

        if response.status_code in [200, 201, 202]:
            logger.info(f"Email envoyé à {destinataire_email}")
            return True
        logger.error(f"Erreur SendGrid : {response.status_code}")
        return False
    except Exception as e:
        logger.error(f"Erreur envoi email : {e}")
        return False


def envoyer_sms(numero_telephone, message):
    if not numero_telephone:
        logger.warning("SMS non envoyé : pas de numéro")
        return False
    if not settings.AFRICASTALKING_API_KEY:
        logger.warning("AFRICASTALKING_API_KEY manquant")
        return False
    try:
        import africastalking
        africastalking.initialize(
            username=settings.AFRICASTALKING_USERNAME,
            api_key=settings.AFRICASTALKING_API_KEY
        )
        sms    = africastalking.SMS
        numero = formater_numero(numero_telephone)
        response   = sms.send(message, [numero])
        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        if recipients and recipients[0].get('status') == 'Success':
            logger.info(f"SMS envoyé à {numero}")
            return True
        logger.error(f"Erreur SMS : {response}")
        return False
    except Exception as e:
        logger.error(f"Erreur envoi SMS : {e}")
        return False


# envoyer_whatsapp définie plus bas (Meta Business API)


def envoyer_rappel_rdv(rdv):
    client      = rdv.client
    responsable = rdv.responsable
    date        = rdv.date_debut.strftime('%d/%m/%Y à %Hh%M')

    # ── Email client ──────────────────────────────────────────
    contenu_client = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Rappel de rendez-vous</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#71717a;">Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>, voici le rappel de votre prochain rendez-vous.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Objet', rdv.titre)}
        {bloc_info('Date', date)}
        {bloc_info('Lieu', rdv.lieu or 'À définir')}
      </table>
      <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">En cas d'empêchement, merci de nous contacter rapidement.</p>
    """

    # ── Email responsable ─────────────────────────────────────
    contenu_resp = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">RDV demain — {client.nom}</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#71717a;">Rappel automatique pour votre rendez-vous de demain.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Client', f"{client.nom} {client.prenom or ''}")}
        {bloc_info('Téléphone client', client.telephone or 'Non renseigné')}
        {bloc_info('Objet', rdv.titre)}
        {bloc_info('Date', date)}
        {bloc_info('Lieu', rdv.lieu or 'À définir')}
      </table>
    """

    sms_text = f"Rappel RDV : {rdv.titre}\nLe {date}\nLieu : {rdv.lieu or 'à définir'}"

    ok_email_client = envoyer_email(client.email, f"Rappel : {rdv.titre} — {date}", base_email(f"Rappel RDV", contenu_client))
    ok_sms_client   = envoyer_sms(client.telephone, sms_text)

    ok_email_resp = False
    ok_sms_resp   = False

    if responsable:
        if responsable.email:
            ok_email_resp = envoyer_email(responsable.email, f"[RDV demain] {rdv.titre} — {client.nom}", base_email("RDV demain", contenu_resp))
        if getattr(responsable, 'phone', None):
            ok_sms_resp = envoyer_sms(responsable.phone, f"[RDV demain] {rdv.titre}\nClient : {client.nom}\n{date}")

    from .models import HistoriqueClient
    destinataires = []
    if ok_email_client or ok_sms_client:   destinataires.append('client')
    if ok_email_resp   or ok_sms_resp:     destinataires.append('responsable')

    HistoriqueClient.objects.create(
        client=client,
        utilisateur=None,
        action=f"Rappel RDV envoyé ({', '.join(destinataires) or 'aucun'}) : {rdv.titre} ({date})"
    )

    return ok_email_client or ok_sms_client or ok_email_resp or ok_sms_resp


def envoyer_message_fidelisation(message):
    client  = message.client
    contenu = remplacer_variables(message.contenu, client)
    succes  = False
    erreur  = ''

    try:
        if message.canal == 'email':
            sujet = remplacer_variables(message.sujet, client)

            # Contenu principal de l'email fidélisation
            contenu_email = f"""
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">{sujet}</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;">Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>,</p>
              <div style="font-size:15px;color:#3f3f46;line-height:1.7;white-space:pre-line;">{contenu}</div>
            """

            succes = envoyer_email(client.email, sujet, base_email(sujet, contenu_email))
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
        logger.error(f"Erreur fidélisation : {e}")

    message.succes = succes
    message.erreur = erreur
    message.save(update_fields=['succes', 'erreur'])
    return succes


def executer_campagne_envoi(campagne):
    from .models import Client, MessageFidelisation
    from django.db.models import Count
    from django.utils import timezone

    if campagne.type_campagne == 'promotion':
        clients = Client.objects.filter(
            statut__in=['actif', 'fidele'], email__gt=''
        ).annotate(nb=Count('interactions')).filter(nb__gte=campagne.seuil_interactions)
    elif campagne.type_campagne == 'relance':
        date_limite = timezone.now() - timezone.timedelta(days=campagne.jours_inactivite)
        clients = Client.objects.filter(email__gt='').exclude(
            interactions__created_at__gte=date_limite
        ).distinct()
    else:
        clients = Client.objects.filter(email__gt='')

    nb_succes = 0
    for client in clients:
        sujet   = remplacer_variables(campagne.sujet,   client)
        contenu = remplacer_variables(campagne.contenu, client)

        contenu_email = f"""
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">{sujet}</h2>
          <p style="margin:0 0 28px;font-size:15px;color:#71717a;">Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>,</p>
          <div style="font-size:15px;color:#3f3f46;line-height:1.7;white-space:pre-line;">{contenu}</div>
        """

        succes = envoyer_email(client.email, sujet, base_email(sujet, contenu_email))

        MessageFidelisation.objects.create(
            client=client,
            type_message='promotion' if campagne.type_campagne == 'promotion' else 'relance',
            canal='email', sujet=sujet, contenu=contenu,
            auto=True, succes=succes,
            erreur='' if succes else 'Échec envoi'
        )

        if succes:
            nb_succes += 1

    campagne.nb_envois_total   += nb_succes
    campagne.derniere_execution = timezone.now()
    campagne.save(update_fields=['nb_envois_total', 'derniere_execution'])

    logger.info(f"Campagne '{campagne.nom}' : {nb_succes}/{clients.count()} envois")
    return nb_succes


# ══════════════════════════════════════════════════════════════
# CONFIRMATION RDV À LA CRÉATION
# ══════════════════════════════════════════════════════════════

def envoyer_confirmation_rdv(rdv):
    """
    Envoyée à la création du RDV.
    Génère un token unique et inclut un bouton de confirmation dans l'email.
    Quand le client clique → GET /api/rendez-vous/confirmer/{token}/ → statut passe à 'confirme'.
    """
    import secrets
    from django.conf import settings as django_settings

    client = rdv.client
    date   = rdv.date_debut.strftime('%d/%m/%Y à %Hh%M')

    # Générer et sauvegarder le token si pas encore fait
    if not rdv.token_confirmation:
        rdv.token_confirmation = secrets.token_urlsafe(32)
        rdv.save(update_fields=['token_confirmation'])

    # URL de confirmation — s'adapte selon DEBUG ou prod
    base_url = getattr(django_settings, 'BASE_URL', 'http://localhost:8000')
    lien_confirmation = f"{base_url}/api/rendez-vous/confirmer/{rdv.token_confirmation}/"

    contenu = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Nouveau rendez-vous</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#71717a;">
        Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>,
        un rendez-vous a été planifié pour vous. Merci de confirmer votre présence.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Objet', rdv.titre)}
        {bloc_info('Date', date)}
        {bloc_info('Lieu', rdv.lieu or 'À définir')}
      </table>
      <div style="margin:28px 0;text-align:center;">
        <a href="{lien_confirmation}"
           style="display:inline-block;padding:14px 32px;background:#10b981;color:#ffffff;
                  text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;
                  letter-spacing:0.02em;">
          ✅ Confirmer ma présence
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
        En cas d'empêchement, contactez-nous directement.<br>
        Nous vous enverrons un rappel la veille du rendez-vous.
      </p>
    """

    envoyer_email(
        client.email,
        f"📅 RDV planifié — {date} — Confirmez votre présence",
        base_email("Nouveau rendez-vous", contenu)
    )
    if client.telephone:
        envoyer_sms(
            client.telephone,
            f"RDV planifié : {rdv.titre}\nLe {date}\nLieu : {rdv.lieu or 'à définir'}\nConfirmez via l'email reçu."
        )


# ══════════════════════════════════════════════════════════════
# MODIFICATION RDV
# ══════════════════════════════════════════════════════════════

def envoyer_notif_modif_rdv(rdv, ancien_statut):
    client = rdv.client
    date   = rdv.date_debut.strftime('%d/%m/%Y à %Hh%M')

    if rdv.statut == 'reporte':
        titre_email = "📅 Votre rendez-vous a été reporté"
        intro       = "Votre rendez-vous a été <strong>reporté</strong>. Voici les nouvelles informations :"
        sujet_sms   = f"RDV reporté : {rdv.titre}\nNouvelle date : {date}"
    elif rdv.statut == 'annule':
        titre_email = "❌ Votre rendez-vous a été annulé"
        intro       = "Nous vous informons que votre rendez-vous a été <strong>annulé</strong>."
        sujet_sms   = f"RDV annulé : {rdv.titre}"
    elif rdv.statut == 'confirme':
        titre_email = "✅ Votre rendez-vous est confirmé"
        intro       = "Votre rendez-vous est maintenant <strong>confirmé</strong>."
        sujet_sms   = f"RDV confirmé : {rdv.titre}\nLe {date}"
    else:
        return  # pas de notif pour les autres changements de statut

    contenu = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">{titre_email}</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#71717a;">
        Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>, {intro}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Objet', rdv.titre)}
        {bloc_info('Date', date)}
        {bloc_info('Lieu', rdv.lieu or 'À définir')}
        {bloc_info('Statut', rdv.statut.capitalize())}
      </table>
      <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">Pour toute question, contactez-nous directement.</p>
    """

    envoyer_email(client.email, titre_email, base_email(titre_email, contenu))
    if client.telephone:
        envoyer_sms(client.telephone, sujet_sms)


# ══════════════════════════════════════════════════════════════
# SUPPRESSION RDV
# ══════════════════════════════════════════════════════════════

def envoyer_notif_annulation_rdv(rdv):
    client = rdv.client
    date   = rdv.date_debut.strftime('%d/%m/%Y à %Hh%M')

    contenu = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Rendez-vous annulé</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#71717a;">
        Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>,
        votre rendez-vous prévu le <strong style="color:#18181b;">{date}</strong> a été annulé.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Objet', rdv.titre)}
        {bloc_info('Date prévue', date)}
        {bloc_info('Lieu', rdv.lieu or 'À définir')}
      </table>
      <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">Nous vous contacterons prochainement pour convenir d'une nouvelle date.</p>
    """

    envoyer_email(client.email, "❌ Rendez-vous annulé", base_email("Annulation RDV", contenu))
    if client.telephone:
        envoyer_sms(client.telephone, f"RDV annulé : {rdv.titre} prévu le {date}.")


# ══════════════════════════════════════════════════════════════
# PRESTATION TERMINÉE
# ══════════════════════════════════════════════════════════════

def envoyer_notif_prestation_terminee(prestation):
    client = prestation.client

    contenu = f"""
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Votre prestation est terminée</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#71717a;">
        Bonjour <strong style="color:#18181b;">{client.nom} {client.prenom or ''}</strong>,
        nous avons le plaisir de vous informer que votre prestation est maintenant terminée.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        {bloc_info('Prestation', prestation.nom)}
        {bloc_info('Montant', f"{prestation.prix_final} Fcfa")}
        {bloc_info('Date de réalisation', prestation.date_realisation.strftime('%d/%m/%Y'))}
      </table>
      <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">Merci de votre confiance. N'hésitez pas à nous contacter pour tout retour.</p>
    """

    envoyer_email(
        client.email,
        f"✅ Prestation terminée — {prestation.nom}",
        base_email("Prestation terminée", contenu)
    )
    if client.telephone:
        envoyer_sms(
            client.telephone,
            f"Votre prestation '{prestation.nom}' est terminée. Montant : {prestation.prix_final} Fcfa. Merci de votre confiance !"
        )


# ══════════════════════════════════════════════════════════════
# WHATSAPP via Meta Business API (remplace CallMeBot)
# ══════════════════════════════════════════════════════════════

def envoyer_whatsapp(numero_telephone, message):
    if not numero_telephone:
        return False

    token    = getattr(settings, 'META_WHATSAPP_TOKEN', '')
    phone_id = getattr(settings, 'META_WHATSAPP_PHONE_ID', '')

    if not token or not phone_id:
        logger.warning("META_WHATSAPP_TOKEN ou META_WHATSAPP_PHONE_ID manquant")
        return False

    try:
        import requests
        numero = formater_numero(numero_telephone).replace('+', '')
        url  = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": numero,
            "type": "text",
            "text": {"body": message}
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            logger.info(f"WhatsApp envoyé à {numero}")
            return True
        logger.error(f"Erreur WhatsApp Meta : {response.status_code} — {response.text}")
        return False
    except Exception as e:
        logger.error(f"Erreur envoi WhatsApp : {e}")
        return False