# ─────────────────────────────────────────────────────────────
#  pdf_generator.py — Génération de la fiche client en PDF
# ─────────────────────────────────────────────────────────────

from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from django.utils import timezone


def generer_fiche_client_pdf(client):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = (
        f'attachment; filename="fiche_{client.code}.pdf"'
    )

    doc = SimpleDocTemplate(
        response, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm,   bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()

    titre_style = ParagraphStyle(
        'Titre', parent=styles['Heading1'],
        fontSize=20, textColor=colors.HexColor('#1e3a5f'),
        spaceAfter=6, alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        'Section', parent=styles['Heading2'],
        fontSize=13, textColor=colors.HexColor('#2563eb'),
        spaceBefore=14, spaceAfter=6,
    )
    normal = ParagraphStyle(
        'Normal2', parent=styles['Normal'],
        fontSize=10, leading=16,
    )
    label_style = ParagraphStyle(
        'Label', parent=styles['Normal'],
        fontSize=9, textColor=colors.HexColor('#6b7280'),
    )

    contenu = []

    # ── En-tête ───────────────────────────────────────────
    contenu.append(Paragraph("SuiviClient CRM", ParagraphStyle(
        'App', parent=styles['Normal'],
        fontSize=11, textColor=colors.HexColor('#2563eb'),
        alignment=TA_CENTER
    )))
    contenu.append(Spacer(1, 0.3*cm))
    contenu.append(Paragraph(
        f"Fiche Client — {client.nom} {client.prenom or ''}",
        titre_style
    ))
    contenu.append(Paragraph(
        f"Générée le {timezone.now().strftime('%d/%m/%Y à %H:%M')}",
        ParagraphStyle('Date', parent=styles['Normal'],
            fontSize=9, textColor=colors.gray, alignment=TA_CENTER)
    ))
    contenu.append(HRFlowable(width="100%", thickness=1,
        color=colors.HexColor('#2563eb'), spaceAfter=14))

    # ── Infos générales (avec responsable) ───────────────
    contenu.append(Paragraph("Informations générales", section_style))

    # Nom complet du responsable
    if client.responsable:
        responsable_nom    = client.responsable.get_full_name()
        responsable_email  = client.responsable.email or '—'
        responsable_tel    = client.responsable.phone or '—'
    else:
        responsable_nom   = '—'
        responsable_email = '—'
        responsable_tel   = '—'

    data_infos = [
        ['Code client',  client.code,
         'Statut',       client.get_statut_display()],
        ['Nom',          f"{client.nom} {client.prenom or ''}",
         'Ville',        client.ville or '—'],
        ['Email',        client.email or '—',
         'Téléphone',    client.telephone or '—'],
        ['Adresse',      client.adresse or '—',
         'Créé le',      client.date_creation.strftime('%d/%m/%Y')],
        # ── Bloc responsable ──────────────────────────────
        ['Responsable',  responsable_nom,
         'Email resp.',  responsable_email],
        ['Tél. resp.',   responsable_tel,
         '',             ''],
    ]

    table_infos = Table(data_infos, colWidths=[3.5*cm, 6*cm, 3.5*cm, 4*cm])
    table_infos.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f3f4f6')),
        ('FONTNAME',   (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME',   (2,0), (2,-1), 'Helvetica-Bold'),
        # Ligne responsable en bleu clair
        ('BACKGROUND', (0,4), (-1,5), colors.HexColor('#eff6ff')),
        ('TEXTCOLOR',  (0,4), (0,5),  colors.HexColor('#2563eb')),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING',    (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,0), (-1,3),
         [colors.white, colors.HexColor('#fafafa')]),
    ]))
    contenu.append(table_infos)

    if client.notes:
        contenu.append(Spacer(1, 0.3*cm))
        contenu.append(Paragraph(f"<b>Notes :</b> {client.notes}", normal))

    # ── Prestations ───────────────────────────────────────
    prestations = client.prestations.all()
    contenu.append(Paragraph(
        f"Prestations ({prestations.count()})", section_style
    ))

    if prestations.exists():
        data_prest = [['Prestation', 'Date', 'Prix', 'Réduction', 'Prix final', 'Statut']]
        total = 0
        for p in prestations:
            data_prest.append([
                p.nom,
                p.date_realisation.strftime('%d/%m/%Y'),
                f"{p.prix} €",
                f"{p.reduction}%",
                f"{p.prix_final} €",
                p.get_statut_display(),
            ])
            if p.statut == 'termine':
                total += float(p.prix_final)

        data_prest.append(['', '', '', 'TOTAL terminées :', f"{total:.2f} €", ''])

        table_prest = Table(data_prest,
            colWidths=[5.5*cm, 2.5*cm, 2*cm, 2.5*cm, 2.5*cm, 2*cm])
        table_prest.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,-1), 9),
            ('GRID',       (0,0), (-1,-2), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0,1), (-1,-2),
             [colors.white, colors.HexColor('#f0f4ff')]),
            ('FONTNAME',   (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f3f4f6')),
            ('ALIGN',      (2,0),  (-1,-1), 'RIGHT'),
            ('PADDING',    (0,0),  (-1,-1), 6),
        ]))
        contenu.append(table_prest)
    else:
        contenu.append(Paragraph("Aucune prestation enregistrée.", label_style))

    # ── Interactions ──────────────────────────────────────
    interactions = client.interactions.all()[:10]
    contenu.append(Paragraph(
        f"Dernières interactions ({client.interactions.count()} au total)",
        section_style
    ))

    if interactions:
        data_inter = [['Type', 'Date', 'Sujet', 'Responsable', 'Statut']]
        for i in interactions:
            data_inter.append([
                i.get_type_interaction_display(),
                i.date.strftime('%d/%m/%Y'),
                i.sujet[:35] + ('...' if len(i.sujet) > 35 else ''),
                i.responsable.get_full_name() if i.responsable else '—',
                i.get_statut_display(),
            ])

        table_inter = Table(data_inter,
            colWidths=[2.5*cm, 2.5*cm, 6.5*cm, 3.5*cm, 2*cm])
        table_inter.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,-1), 9),
            ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1),
             [colors.white, colors.HexColor('#fafafa')]),
            ('PADDING',    (0,0), (-1,-1), 6),
        ]))
        contenu.append(table_inter)
    else:
        contenu.append(Paragraph("Aucune interaction enregistrée.", label_style))

    # ── Rendez-vous ───────────────────────────────────────
    rdvs = client.rendez_vous.all()[:10]
    contenu.append(Paragraph(
        f"Rendez-vous ({client.rendez_vous.count()} au total)",
        section_style
    ))

    if rdvs:
        data_rdv = [['Titre', 'Date', 'Lieu', 'Responsable', 'Statut']]
        for r in rdvs:
            data_rdv.append([
                r.titre[:30] + ('...' if len(r.titre) > 30 else ''),
                r.date_debut.strftime('%d/%m/%Y %H:%M'),
                (r.lieu or '—')[:20],
                r.responsable.get_full_name() if r.responsable else '—',
                r.get_statut_display(),
            ])

        table_rdv = Table(data_rdv,
            colWidths=[4*cm, 3*cm, 3*cm, 3.5*cm, 2.5*cm])
        table_rdv.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
            ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',   (0,0), (-1,-1), 9),
            ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1),
             [colors.white, colors.HexColor('#fafafa')]),
            ('PADDING',    (0,0), (-1,-1), 6),
        ]))
        contenu.append(table_rdv)
    else:
        contenu.append(Paragraph("Aucun rendez-vous enregistré.", label_style))

    # ── Pied de page ──────────────────────────────────────
    contenu.append(Spacer(1, 0.5*cm))
    contenu.append(HRFlowable(width="100%", thickness=0.5,
        color=colors.HexColor('#e5e7eb')))
    contenu.append(Spacer(1, 0.2*cm))
    contenu.append(Paragraph(
        f"Document confidentiel — SuiviClient CRM — {client.code}"
        + (f" — Responsable : {client.responsable.get_full_name()}" if client.responsable else ""),
        ParagraphStyle('Footer', parent=styles['Normal'],
            fontSize=8, textColor=colors.gray, alignment=TA_CENTER)
    ))

    doc.build(contenu)
    return response