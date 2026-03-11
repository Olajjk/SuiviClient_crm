import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Trash2, MessageSquare, Calendar,
  Briefcase, Clock, Plus, Loader2, Mail, Phone, MapPin,
  User, TrendingUp, FileText, CheckCircle
} from 'lucide-react'
import { clientAPI, interactionAPI, rdvAPI, prestationAPI, telechargerPDF } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const BADGE = {
  prospect: 'bg-violet-100 text-violet-700',
  actif:    'bg-emerald-100 text-emerald-700',
  inactif:  'bg-gray-100 text-gray-500',
  fidele:   'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  termine:  'bg-emerald-100 text-emerald-700',
  annule:   'bg-red-100 text-red-600',
  planifie: 'bg-blue-100 text-blue-700',
  confirme: 'bg-emerald-100 text-emerald-700',
  effectue: 'bg-gray-100 text-gray-500',
}

// ── Modals ────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

function ModalInteraction({ clientId, onClose, onSaved }) {
  const [form, setForm] = useState({ client: clientId, type_interaction: 'appel', statut: 'effectue', date: '', sujet: '', description: '' })
  const [loading, setLoading] = useState(false)
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try { await interactionAPI.create(form); toast.success('Interaction ajoutée'); onSaved() }
    catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <Modal title="Nouvelle interaction" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select name="type_interaction" value={form.type_interaction} onChange={set} className={inputCls}>
              {['appel','email','reunion','visite','sms','whatsapp','autre'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select name="statut" value={form.statut} onChange={set} className={inputCls}>
              <option value="effectue">Effectué</option>
              <option value="planifie">Planifié</option>
              <option value="annule">Annulé</option>
            </select>
          </Field>
        </div>
        <Field label="Date *"><input type="datetime-local" name="date" value={form.date} onChange={set} required className={inputCls} /></Field>
        <Field label="Sujet *"><input name="sujet" value={form.sujet} onChange={set} required className={inputCls} /></Field>
        <Field label="Description"><textarea name="description" value={form.description} onChange={set} rows={2} className={inputCls + ' resize-none'} /></Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ModalRdv({ clientId, onClose, onSaved }) {
  const [form, setForm] = useState({ client: clientId, titre: '', date_debut: '', date_fin: '', lieu: '', statut: 'planifie', description: '' })
  const [loading, setLoading] = useState(false)
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try { await rdvAPI.create(form); toast.success('Rendez-vous créé'); onSaved() }
    catch (err) { toast.error(err.response?.data?.date_fin?.[0] || 'Erreur') } finally { setLoading(false) }
  }

  return (
    <Modal title="Nouveau rendez-vous" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre *"><input name="titre" value={form.titre} onChange={set} required className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début *"><input type="datetime-local" name="date_debut" value={form.date_debut} onChange={set} required className={inputCls} /></Field>
          <Field label="Fin *"><input type="datetime-local" name="date_fin" value={form.date_fin} onChange={set} required className={inputCls} /></Field>
        </div>
        <Field label="Lieu"><input name="lieu" value={form.lieu} onChange={set} className={inputCls} /></Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />} Créer
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ModalPrestation({ clientId, onClose, onSaved }) {
  const [form, setForm] = useState({ client: clientId, nom: '', prix: '', reduction: '0', date_realisation: '', statut: 'en_cours', description: '' })
  const [loading, setLoading] = useState(false)
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const prixFinal = form.prix ? (parseFloat(form.prix) * (1 - parseFloat(form.reduction || 0) / 100)).toFixed(2) : null

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try { await prestationAPI.create(form); toast.success('Prestation créée'); onSaved() }
    catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <Modal title="Nouvelle prestation" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nom *"><input name="nom" value={form.nom} onChange={set} required className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix *"><input type="number" name="prix" value={form.prix} onChange={set} required min="0" step="0.01" className={inputCls} /></Field>
          <Field label="Réduction (%)"><input type="number" name="reduction" value={form.reduction} onChange={set} min="0" max="100" className={inputCls} /></Field>
        </div>
        {prixFinal && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-emerald-600">Prix final</span>
            <span className="text-sm font-bold text-emerald-700">{prixFinal} €</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *"><input type="date" name="date_realisation" value={form.date_realisation} onChange={set} required className={inputCls} /></Field>
          <Field label="Statut">
            <select name="statut" value={form.statut} onChange={set} className={inputCls}>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea name="description" value={form.description} onChange={set} rows={2} className={inputCls + ' resize-none'} /></Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />} Créer
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ─────────────────────────────────────────────────────

const ONGLETS = [
  { id: 'interactions', label: 'Interactions', icon: MessageSquare },
  { id: 'rdv',          label: 'Rendez-vous',  icon: Calendar },
  { id: 'prestations',  label: 'Prestations',  icon: Briefcase },
  { id: 'historique',   label: 'Historique',   icon: Clock },
]

const ADD_BTN = {
  interactions: { label: 'Interaction', modal: 'interaction' },
  rdv:          { label: 'Rendez-vous', modal: 'rdv' },
  prestations:  { label: 'Prestation',  modal: 'prestation' },
}

export default function ClientDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [client,       setClient]       = useState(null)
  const [interactions, setInteractions] = useState([])
  const [rdvs,         setRdvs]         = useState([])
  const [prestations,  setPrestations]  = useState([])
  const [terminerLoading, setTerminerLoading] = useState(null)
  const [historique,   setHistorique]   = useState([])
  const [onglet,       setOnglet]       = useState('interactions')
  const [loading,      setLoading]      = useState(true)
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [modal,        setModal]        = useState(null)

  const charger = () => {
    Promise.all([
      clientAPI.detail(id),
      interactionAPI.list({ client: id }),
      rdvAPI.list({ client: id }),
      prestationAPI.list({ client: id }),
      clientAPI.historique(id),
    ]).then(([c, i, r, p, h]) => {
      setClient(c.data)
      setInteractions(i.data.results ?? i.data)
      setRdvs(r.data.results ?? r.data)
      setPrestations(p.data.results ?? p.data)
      setHistorique(h.data.results ?? h.data)
    }).catch(() => toast.error('Erreur chargement'))
    .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [id])

  const telecharger = async () => {
    setPdfLoading(true)
    try {
      const { data } = await clientAPI.pdf(id)
      telechargerPDF(data, `fiche_${client.code}.pdf`)
      toast.success('PDF téléchargé')
    } catch { toast.error('Erreur PDF') } finally { setPdfLoading(false) }
  }

  const [modalSuppr, setModalSuppr] = useState(false)

  const supprimer = async () => {
    try {
      await clientAPI.delete(id)
      toast.success('Client supprimé')
      navigate('/clients')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!client) return <p className="text-center text-gray-400 mt-10">Client introuvable</p>

  const ca = prestations.filter(p => p.statut === 'termine').reduce((s, p) => s + parseFloat(p.prix_final), 0)

  const terminer = async (p) => {
    if (!confirm(`Marquer "${p.nom}" comme terminée ?\nUn email sera envoyé à ${client?.nom}.`)) return
    setTerminerLoading(p.id)
    try {
      await prestationAPI.update(p.id, { ...p, statut: 'termine' })
      toast.success(`✅ "${p.nom}" terminée — client notifié`)
      charger()
    } catch { toast.error('Erreur lors de la mise à jour') }
    finally { setTerminerLoading(null) }
  }
  const resp = client.responsable

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{client.nom} {client.prenom}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGE[client.statut]}`}>
                {client.statut}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-0.5">{client.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={telecharger} disabled={pdfLoading}
            className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Download size={14} />
            {pdfLoading ? 'Génération...' : 'PDF'}
          </button>
          <button onClick={() => setModalSuppr(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </div>

      {/* ── Ligne principale : profil + stats ── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Carte profil — occupe 2 colonnes */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">

          {/* Coordonnées */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Coordonnées</p>
            <div className="space-y-2.5">
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={13} className="text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-700">{client.email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={13} className="text-green-500" />
                  </div>
                  <span className="text-sm text-gray-700">{client.telephone}</span>
                </div>
              )}
              {(client.ville || client.adresse) && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={13} className="text-orange-500" />
                  </div>
                  <div>
                    {client.ville && <p className="text-sm text-gray-700">{client.ville}</p>}
                    {client.adresse && <p className="text-xs text-gray-400">{client.adresse}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Responsable */}
          {resp && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Responsable</p>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {(resp.first_name?.[0] || '') + (resp.last_name?.[0] || '')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{resp.first_name} {resp.last_name}</p>
                  <p className="text-xs text-gray-400 truncate">{resp.email}</p>
                </div>
                {resp.phone && <p className="text-xs text-gray-400">{resp.phone}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-600 leading-relaxed">{client.notes}</p>
            </div>
          )}

          {/* Créé le */}
          <p className="text-xs text-gray-300 pt-2 border-t border-gray-50">
            Créé le {format(new Date(client.date_creation), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Stats — 2 colonnes à droite */}
        <div className="col-span-2 grid grid-cols-2 gap-4 content-start">
          {[
            {
              label: 'Interactions',
              value: interactions.length,
              icon: MessageSquare,
              color: 'bg-blue-500',
              light: 'bg-blue-50',
              text: 'text-blue-600',
              onClick: () => setOnglet('interactions'),
            },
            {
              label: 'Rendez-vous',
              value: rdvs.length,
              icon: Calendar,
              color: 'bg-violet-500',
              light: 'bg-violet-50',
              text: 'text-violet-600',
              onClick: () => setOnglet('rdv'),
            },
            {
              label: 'Prestations',
              value: prestations.length,
              icon: Briefcase,
              color: 'bg-amber-500',
              light: 'bg-amber-50',
              text: 'text-amber-600',
              onClick: () => setOnglet('prestations'),
            },
            {
              label: 'CA total',
              value: `${ca.toFixed(2)} €`,
              icon: TrendingUp,
              color: 'bg-emerald-500',
              light: 'bg-emerald-50',
              text: 'text-emerald-600',
              onClick: () => setOnglet('prestations'),
            },
          ].map(({ label, value, icon: Icon, light, text, onClick }) => (
            <button key={label} onClick={onClick}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-9 h-9 ${light} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={16} className={text} />
              </div>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-1">
          <div className="flex">
            {ONGLETS.map(({ id: oid, label, icon: Icon }) => (
              <button key={oid} onClick={() => setOnglet(oid)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${onglet === oid
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <Icon size={14} />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                  ${onglet === oid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                  {oid === 'interactions' ? interactions.length
                   : oid === 'rdv' ? rdvs.length
                   : oid === 'prestations' ? prestations.length
                   : historique.length}
                </span>
              </button>
            ))}
          </div>
          {ADD_BTN[onglet] && (
            <button onClick={() => setModal(ADD_BTN[onglet].modal)}
              className="flex items-center gap-1.5 mr-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
              <Plus size={12} />
              {ADD_BTN[onglet].label}
            </button>
          )}
        </div>

        <div className="p-5">

          {/* Interactions */}
          {onglet === 'interactions' && (
            <div className="space-y-2">
              {interactions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MessageSquare size={32} className="text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Aucune interaction pour l'instant</p>
                </div>
              ) : interactions.map(i => (
                <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={13} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{i.sujet}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {i.type_interaction} · {format(new Date(i.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                    {i.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{i.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${BADGE[i.statut] || 'bg-gray-100 text-gray-500'}`}>
                    {i.statut}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* RDV */}
          {onglet === 'rdv' && (
            <div className="space-y-2">
              {rdvs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Calendar size={32} className="text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Aucun rendez-vous planifié</p>
                </div>
              ) : rdvs.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-11 h-11 bg-violet-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 font-bold text-sm leading-none">
                      {format(new Date(r.date_debut), 'dd')}
                    </span>
                    <span className="text-violet-400 text-xs uppercase">
                      {format(new Date(r.date_debut), 'MMM', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{r.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(r.date_debut), 'HH:mm')}
                      {r.lieu && ` · ${r.lieu}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${BADGE[r.statut] || 'bg-gray-100 text-gray-500'}`}>
                    {r.statut}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Prestations */}
          {onglet === 'prestations' && (
            prestations.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Briefcase size={32} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Aucune prestation enregistrée</p>
              </div>
            ) : (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Prestation', 'Date', 'Prix', 'Réd.', 'Prix final', 'Statut', ''].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {prestations.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <p className="text-sm font-medium text-gray-800">{p.nom}</p>
                          {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">
                          {format(new Date(p.date_realisation), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500">{p.prix} €</td>
                        <td className="py-3 pr-4 text-sm text-emerald-600">
                          {p.reduction > 0 ? `-${p.reduction}%` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-sm font-semibold text-gray-900">{p.prix_final} €</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE[p.statut] || 'bg-gray-100 text-gray-500'}`}>
                            {p.statut}
                          </span>
                        </td>
                        <td className="py-3 pl-2">
                          {p.statut === 'en_cours' && (
                            <button
                              onClick={() => terminer(p)}
                              disabled={terminerLoading === p.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {terminerLoading === p.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <CheckCircle size={11} />}
                              Terminer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ca > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <div className="flex items-center gap-3 bg-emerald-50 rounded-lg px-4 py-2">
                      <span className="text-xs text-emerald-600">CA terminées</span>
                      <span className="text-base font-bold text-emerald-700">{ca.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Historique */}
          {onglet === 'historique' && (
            <div className="space-y-0">
              {historique.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Clock size={32} className="text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Aucune activité enregistrée</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
                  {historique.map((h, i) => (
                    <div key={h.id} className="relative flex gap-4 pb-4">
                      <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-gray-700">{h.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {h.utilisateur_nom || 'Système'} · {format(new Date(h.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {/* Modal confirmation suppression client */}
      {modalSuppr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              Supprimer ce client ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <strong>{client.nom} {client.prenom}</strong>
            </p>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center mb-5">
              ⚠️ Cette action est irréversible. Toutes les données associées (RDV, prestations, interactions) seront supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalSuppr(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => { setModalSuppr(false); supprimer() }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'interaction' && <ModalInteraction clientId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); charger() }} />}
      {modal === 'rdv'         && <ModalRdv         clientId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); charger() }} />}
      {modal === 'prestation'  && <ModalPrestation  clientId={id} onClose={() => setModal(null)} onSaved={() => { setModal(null); charger() }} />}
    </div>
  )
}