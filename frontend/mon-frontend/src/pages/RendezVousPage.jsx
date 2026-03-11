import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Bell, BellOff, Calendar, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { rdvAPI, clientAPI } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUTS = ['planifie','confirme','effectue','annule','reporte']
const STATUTS_LABELS = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  effectue: 'Effectué',
  annule:   'Annulé',
  reporte:  'Reporté',
}
const COULEURS = {
  planifie: 'bg-blue-50 text-blue-700',
  confirme: 'bg-green-50 text-green-700',
  effectue: 'bg-gray-100 text-gray-500',
  annule:   'bg-red-50 text-red-600',
  reporte:  'bg-yellow-50 text-yellow-700',
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

function ModalRdv({ rdv, onClose, onSaved }) {
  const initial = rdv ? {
    client: rdv.client, titre: rdv.titre, description: rdv.description || '',
    date_debut: rdv.date_debut?.slice(0,16), date_fin: rdv.date_fin?.slice(0,16),
    lieu: rdv.lieu || '', statut: rdv.statut
  } : { client:'', titre:'', description:'', date_debut:'', date_fin:'', lieu:'', statut:'planifie' }

  const [form, setForm]       = useState(initial)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  useEffect(() => {
    clientAPI.list({ page_size: 200 }).then(r => setClients(r.data.results ?? r.data))
  }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (rdv) {
        await rdvAPI.update(rdv.id, form)
        toast.success('RDV modifié — le client sera notifié si le statut a changé')
      } else {
        await rdvAPI.create(form)
        toast.success('RDV créé — confirmation envoyée au client')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.date_fin?.[0] || 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{rdv ? 'Modifier le RDV' : 'Nouveau rendez-vous'}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {!rdv && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Client *</label>
              <select name="client" value={form.client} onChange={set} required className={inputCls}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titre *</label>
            <input name="titre" value={form.titre} onChange={set} required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Début *</label>
              <input type="datetime-local" name="date_debut" value={form.date_debut} onChange={set} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fin *</label>
              <input type="datetime-local" name="date_fin" value={form.date_fin} onChange={set} required className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lieu</label>
              <input name="lieu" value={form.lieu} onChange={set} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select name="statut" value={form.statut} onChange={set} className={inputCls}>
                {STATUTS.map(s => <option key={s} value={s}>{STATUTS_LABELS[s] || s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={set} rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={13} className="animate-spin" />}
              {rdv ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RendezVousPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre,  setFiltre]  = useState('')
  const [modal,   setModal]   = useState(false)   // false | 'nouveau' | rdv object
  const [confirmSuppr, setConfirmSuppr] = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtre && filtre !== 'a_venir') params.statut = filtre
      if (filtre === 'a_venir') params.a_venir = 'true'
      const { data } = await rdvAPI.list(params)
      setItems(data.results ?? data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [filtre])

  // Rafraîchir quand l'utilisateur revient sur l'onglet
  // (ex: après que le client a cliqué sur le lien de confirmation)
  useEffect(() => {
    const onFocus = () => charger()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [filtre])

  const notifier = async (id, e) => {
    e.stopPropagation()
    try {
      await rdvAPI.notifier(id)
      toast.success('Rappel envoyé !')
      charger()
    } catch { toast.error('Erreur envoi rappel') }
  }

  const supprimer = async (rdv) => {
    try {
      await rdvAPI.delete(rdv.id)
      toast.success('RDV supprimé — le client a été notifié')
      setConfirmSuppr(null)
      charger()
    } catch { toast.error('Erreur suppression') }
  }

  const filtres = [
    { val:'', label:'Tous' },
    { val:'a_venir', label:'À Venir' },
    ...STATUTS.map(s => ({ val: s, label: STATUTS_LABELS[s] || s }))
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} rendez-vous</p>
        </div>
        <button onClick={() => setModal('nouveau')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 flex-wrap">
        {filtres.map(f => (
          <button key={f.val} onClick={() => setFiltre(f.val)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filtre === f.val ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Calendar size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun rendez-vous</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(r => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 group">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-violet-700 font-bold text-sm leading-none">{format(new Date(r.date_debut), 'dd')}</span>
                  <span className="text-violet-400 text-xs">{format(new Date(r.date_debut), 'MMM', { locale: fr })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{r.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Link to={`/clients/${r.client}`} className="hover:text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                      {r.client_nom}{r.client_prenom ? ' ' + r.client_prenom : ''}
                      {r.client_code && <span className="ml-1 text-gray-300 font-normal">#{r.client_code}</span>}
                    </Link>
                    {' · '}{format(new Date(r.date_debut), 'HH:mm')} → {format(new Date(r.date_fin), 'HH:mm')}
                    {r.lieu && ` · ${r.lieu}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${COULEURS[r.statut] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUTS_LABELS[r.statut] || r.statut}
                  </span>
                  {/* Rappel */}
                  <button onClick={e => notifier(r.id, e)} title="Envoyer rappel"
                    className={`p-1.5 rounded-lg transition-colors ${r.notification_envoyee ? 'text-gray-300 cursor-default' : 'text-blue-500 hover:bg-blue-50'}`}
                    disabled={r.notification_envoyee}>
                    {r.notification_envoyee ? <BellOff size={15} /> : <Bell size={15} />}
                  </button>
                  {/* Modifier */}
                  <button onClick={e => { e.stopPropagation(); setModal(r) }} title="Modifier"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Pencil size={14} />
                  </button>
                  {/* Supprimer */}
                  <button onClick={e => { e.stopPropagation(); setConfirmSuppr(r) }} title="Supprimer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création/modification */}
      {modal && (
        <ModalRdv
          rdv={modal === 'nouveau' ? null : modal}
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); charger() }}
        />
      )}

      {/* Confirmation suppression */}
      {confirmSuppr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Supprimer ce RDV ?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{confirmSuppr.titre}</strong> — {format(new Date(confirmSuppr.date_debut), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
              ⚠️ Le client recevra un email d'annulation automatiquement.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSuppr(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => supprimer(confirmSuppr)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}