import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MessageSquare, Eye } from 'lucide-react'
import { interactionAPI, clientAPI } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPES = ['','appel','email','reunion','visite','sms','whatsapp','autre']
const COULEURS = { effectue:'bg-green-50 text-green-700', planifie:'bg-blue-50 text-blue-700', annule:'bg-red-50 text-red-600' }

function ModalInteraction({ onClose, onSaved }) {
  const [form, setForm] = useState({ client:'', type_interaction:'appel', statut:'effectue', date:'', sujet:'', description:'' })
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  useEffect(() => { clientAPI.list({ page_size: 200 }).then(r => setClients(r.data.results ?? r.data)) }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await interactionAPI.create(form)
      toast.success('Interaction ajoutée !')
      onSaved()
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle interaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
            <select name="client" value={form.client} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select name="type_interaction" value={form.type_interaction} onChange={handle}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select name="statut" value={form.statut} onChange={handle}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="planifie">Planifié</option>
                <option value="effectue">Effectué</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
            <input type="datetime-local" name="date" value={form.date} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet *</label>
            <input name="sujet" value={form.sujet} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InteractionsPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('')
  const [modal,   setModal]   = useState(false)
  const [detail,  setDetail]  = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await interactionAPI.list({ search, type })
      setItems(data.results ?? data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [search, type])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Interactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} interaction(s)</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Nouvelle interaction
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={type} onChange={e => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les types</option>
          {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><MessageSquare size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune interaction</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(i => (
              <div key={i.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(detail?.id === i.id ? null : i)}>
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={15} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{i.sujet}</p>
                  <p className="text-xs text-gray-400">
                    <Link to={`/clients/${i.client}`} className="hover:text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{i.client_nom}</Link>
                    {' · '}{i.type_interaction} · {format(new Date(i.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COULEURS[i.statut] || 'bg-gray-100 text-gray-500'}`}>{i.statut}</span>
              </div>
            ))}
            {detail && (
              <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">{detail.sujet}</h3>
                <p className="text-sm text-blue-800">{detail.description || 'Aucune description'}</p>
                <p className="text-xs text-blue-600 mt-2">Responsable : {detail.responsable_nom || '—'}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {modal && <ModalInteraction onClose={() => setModal(false)} onSaved={() => { setModal(false); charger() }} />}
    </div>
  )
}