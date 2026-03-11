# ─────────────────────────────────────────────────────────────
#  tasks.py — Tâches automatiques Celery
# ─────────────────────────────────────────────────────────────

import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════
#  TÂCHE 1 — Rappels RDV quotidiens (client + responsable)
# ══════════════════════════════════════════════════════════════

@shared_task
def envoyer_rappels_rdv():
    from .models import RendezVous
    from .notifications import envoyer_rappel_rdv

    maintenant   = timezone.now()
    debut_demain = (maintenant + timezone.timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    fin_demain = debut_demain + timezone.timedelta(days=1)

    rdvs = RendezVous.objects.filter(
        date_debut__gte=debut_demain,
        date_debut__lt=fin_demain,
        notification_envoyee=False,
        statut__in=['planifie', 'confirme']
    ).select_related('client', 'responsable')

    nb_envoyes = 0
    for rdv in rdvs:
        succes = envoyer_rappel_rdv(rdv)
        if succes:
            rdv.notification_envoyee = True
            rdv.save(update_fields=['notification_envoyee'])
            nb_envoyes += 1

    logger.info(f"Rappels RDV : {nb_envoyes} envoyés")
    return f"{nb_envoyes} rappels envoyés"


# ══════════════════════════════════════════════════════════════
#  TÂCHE 2 — Rappels Interactions à venir (responsable)
#  Exécutée tous les jours à 7h30
#  Notifie le responsable des interactions planifiées du jour
# ══════════════════════════════════════════════════════════════

@shared_task
def envoyer_rappels_interactions():
    """
    Cherche les interactions planifiées pour aujourd'hui
    et envoie un email + SMS au responsable assigné.
    Le client n'est pas notifié (les interactions sont internes).
    """
    from .models import Interaction
    from .notifications import envoyer_email, envoyer_sms

    maintenant    = timezone.now()
    debut_auj     = maintenant.replace(hour=0, minute=0, second=0, microsecond=0)
    fin_auj       = debut_auj + timezone.timedelta(days=1)

    interactions = Interaction.objects.filter(
        date__gte=debut_auj,
        date__lt=fin_auj,
        statut='planifie'
    ).select_related('client', 'responsable')

    nb_envoyes = 0

    for interaction in interactions:
        responsable = interaction.responsable
        client      = interaction.client
        heure       = interaction.date.strftime('%H:%M')
        date_str    = interaction.date.strftime('%d/%m/%Y à %H:%M')

        if not responsable:
            logger.warning(f"Interaction {interaction.id} sans responsable — rappel ignoré")
            continue

        # ── Email au responsable ──────────────────────────
        if responsable.email:
            sujet_email = f"[Rappel Interaction] {interaction.type_interaction.capitalize()} avec {client.nom} à {heure}"
            contenu_email = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Rappel d'interaction planifiée</h2>
                <p>Bonjour <strong>{responsable.get_full_name()}</strong>,</p>
                <p>Vous avez une interaction planifiée <strong>aujourd'hui</strong> :</p>
                <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #7c3aed;">
                    <p><strong>👤 Client :</strong> {client.nom} {client.prenom or ''}</p>
                    <p><strong>📞 Téléphone :</strong> {client.telephone or 'Non renseigné'}</p>
                    <p><strong>📧 Email :</strong> {client.email or 'Non renseigné'}</p>
                    <p><strong>🔄 Type :</strong> {interaction.get_type_interaction_display()}</p>
                    <p><strong>📅 Heure :</strong> {heure}</p>
                    <p><strong>📋 Sujet :</strong> {interaction.sujet}</p>
                    {f'<p><strong>📝 Description :</strong> {interaction.description}</p>' if interaction.description else ''}
                </div>
                <p>Cordialement,<br><strong>SuiviClient CRM</strong></p>
            </div>
            """
            envoyer_email(responsable.email, sujet_email, contenu_email)

        # ── SMS au responsable ────────────────────────────
        if responsable.phone:
            sms_resp = (
                f"[Interaction] {interaction.get_type_interaction_display()}\n"
                f"Client : {client.nom}\n"
                f"Aujourd'hui à {heure}\n"
                f"Sujet : {interaction.sujet[:40]}\n"
                f"SuiviClient"
            )
            envoyer_sms(responsable.phone, sms_resp)

        nb_envoyes += 1

    logger.info(f"Rappels interactions : {nb_envoyes} responsables notifiés")
    return f"{nb_envoyes} rappels interactions envoyés"


# ══════════════════════════════════════════════════════════════
#  TÂCHE 3 — Exécuter une campagne spécifique
# ══════════════════════════════════════════════════════════════

@shared_task
def executer_campagne(campagne_id):
    from .models import Campagne
    from .notifications import executer_campagne_envoi

    try:
        campagne = Campagne.objects.get(id=campagne_id)
    except Campagne.DoesNotExist:
        logger.error(f"Campagne {campagne_id} introuvable")
        return f"Campagne {campagne_id} introuvable"

    nb = executer_campagne_envoi(campagne)
    return f"Campagne '{campagne.nom}' : {nb} envois"


# ══════════════════════════════════════════════════════════════
#  TÂCHE 4 — Exécuter toutes les campagnes actives
# ══════════════════════════════════════════════════════════════

@shared_task
def executer_toutes_campagnes():
    from .models import Campagne

    campagnes = Campagne.objects.filter(statut='active')
    for campagne in campagnes:
        executer_campagne.delay(campagne.id)

    return f"{campagnes.count()} campagnes lancées"


# ══════════════════════════════════════════════════════════════
#  TÂCHE 5 — Relancer les clients inactifs
# ══════════════════════════════════════════════════════════════

@shared_task
def relancer_clients_inactifs():
    """
    Envoie une relance aux clients inactifs depuis 60 jours.
    Fréquence : 2x par mois (1er et 15 de chaque mois, configuré dans celery.py).
    Anti-spam  : on vérifie qu'on n'a PAS déjà relancé ce client dans les 14 derniers jours.
    Canal      : email + WhatsApp si le client a un numéro de téléphone.
    """
    from .models import Client, MessageFidelisation
    from .notifications import envoyer_email, envoyer_whatsapp, base_email

    maintenant    = timezone.now()
    date_limite   = maintenant - timezone.timedelta(days=60)
    # Anti-spam : 14 jours = on ne peut pas recevoir 2 relances en moins de 2 semaines
    seuil_relance = maintenant - timezone.timedelta(days=14)

    clients_inactifs = Client.objects.filter(
        statut__in=['actif', 'prospect', 'inactif']
    ).exclude(
        interactions__created_at__gte=date_limite        # a eu une interaction récente → skip
    ).exclude(
        messages_fidelisation__auto=True,
        messages_fidelisation__envoye_le__gte=seuil_relance  # déjà relancé il y a moins de 14j → skip
    ).distinct()

    nb_relances = 0

    for client in clients_inactifs:
        if client.statut == 'actif':
            client.statut = 'inactif'
            client.save(update_fields=['statut'])

        prenom = client.prenom or client.nom
        sujet  = f"Nous pensons à vous, {prenom} !"

        contenu_html = base_email("À bientôt !", f"""
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Vous nous manquez</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#71717a;">
            Bonjour <strong style="color:#18181b;">{prenom}</strong>,<br>
            cela fait un moment que nous n'avons pas eu l'occasion d'échanger.
            Nous sommes toujours disponibles si vous avez besoin de nous.
          </p>
          <p style="margin:0;font-size:14px;color:#71717a;">
            N'hésitez pas à nous contacter — nous serons ravis de vous retrouver.
          </p>
        """)

        msg_whatsapp = (
            f"Bonjour {prenom} ! 👋\n"
            f"Cela fait un moment que nous n'avons pas eu l'occasion d'échanger.\n"
            f"Nous sommes toujours disponibles si vous avez besoin de nous. À bientôt ! 😊\n"
            f"— SMART PILOTE"
        )

        # ── Email ──────────────────────────────────────────────
        succes_email = False
        if client.email:
            succes_email = envoyer_email(client.email, sujet, contenu_html)
            MessageFidelisation.objects.create(
                client=client, type_message='relance', canal='email',
                sujet=sujet, contenu=sujet, auto=True,
                succes=succes_email,
                erreur='' if succes_email else 'Adresse email invalide ou SendGrid indisponible'
            )

        # ── WhatsApp ───────────────────────────────────────────
        succes_wa = False
        if client.telephone:
            succes_wa = envoyer_whatsapp(client.telephone, msg_whatsapp)
            MessageFidelisation.objects.create(
                client=client, type_message='relance', canal='whatsapp',
                sujet=sujet, contenu=msg_whatsapp, auto=True,
                succes=succes_wa,
                erreur='' if succes_wa else 'Numéro invalide ou Meta WhatsApp non configuré'
            )

        if succes_email or succes_wa:
            nb_relances += 1

    logger.info(f"Relance clients inactifs : {nb_relances} clients atteints")
    return f"{nb_relances} clients relancés"