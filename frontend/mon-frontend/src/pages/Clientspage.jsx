import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileDown, Search, ChevronLeft, ChevronRight, Users, X, Loader2, Trash2 } from 'lucide-react'
import { clientAPI, telechargerFichier } from '../api'
import toast from 'react-hot-toast'

const STATUTS = ['tous', 'prospect', 'actif', 'inactif', 'fidele']
const BADGES  = {
  prospect: 'bg-purple-100 text-purple-700',
  actif:    'bg-green-100 text-green-700',
  inactif:  'bg-gray-100 text-gray-600',
  fidele:   'bg-blue-100 text-blue-700',
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

function ModalNouveauClient({ onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    ville: '', adresse: '', statut: 'prospect', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    setLoading(true)
    try {
      const { data } = await clientAPI.create(form)
      toast.success(`Client ${data.nom} créé !`)
      onSaved(data.id)
    } catch (err) {
      const msg = err.response?.data
      if (msg?.nom)   toast.error('Nom : ' + msg.nom[0])
      else if (msg?.email) toast.error('Email : ' + msg.email[0])
      else toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Nouveau client</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
              <input name="nom" value={form.nom} onChange={set} required className={inputCls} placeholder="Dupont" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
              <input name="prenom" value={form.prenom} onChange={set} className={inputCls} placeholder="Jean" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={set} className={inputCls} placeholder="jean@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
              <input name="telephone" value={form.telephone} onChange={set} className={inputCls} placeholder="+22961..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
              <input name="ville" value={form.ville} onChange={set} className={inputCls} placeholder="Cotonou" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select name="statut" value={form.statut} onChange={set} className={inputCls}>
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="fidele">Fidèle</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
            <input name="adresse" value={form.adresse} onChange={set} className={inputCls} placeholder="Quartier, rue..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={set} rows={2} className={inputCls + ' resize-none'} placeholder="Informations complémentaires..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {loading && <Loader2 size={13} className="animate-spin" />}
              Créer le client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients,   setClients]   = useState([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [statut,    setStatut]    = useState('tous')
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [modal,     setModal]     = useState(false)
  const [confirmSuppr, setConfirmSuppr] = useState(null) // null | objet client
  const navigate  = useNavigate()
  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await clientAPI.list({ search, statut, page, page_size: PAGE_SIZE })
      setClients(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [search, statut, page])

  useEffect(() => { charger() }, [charger])
  useEffect(() => { setPage(1) }, [search, statut])

  const supprimer = async (client) => {
    try {
      await clientAPI.delete(client.id)
      toast.success(`${client.nom} supprimé`)
      setConfirmSuppr(null)
      charger()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      const { data } = await clientAPI.exportExcel()
      telechargerFichier(data, 'clients.xlsx')
      toast.success('Export téléchargé')
    } catch {
      toast.error('Erreur export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <FileDown size={15} />
            {exporting ? 'Export...' : 'Excel'}
          </button>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />
            Nouveau client
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUTS.map(s => (
            <button key={s} onClick={() => setStatut(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                ${statut === s ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={36} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 mb-3">Aucun client trouvé</p>
            <button onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Créer un client
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Client', 'Email', 'Téléphone', 'Ville', 'Statut', 'Responsable', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-bold">{c.nom?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.nom} {c.prenom}</p>
                          <p className="text-xs text-gray-400">{c.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.telephone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.ville || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGES[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.responsable ? `${c.responsable.first_name} ${c.responsable.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmSuppr(c) }}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Page {page} sur {totalPages} · {total} résultats</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
                    return p <= totalPages ? (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                          ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                        {p}
                      </button>
                    ) : null
                  })}
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {confirmSuppr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              Supprimer ce client ?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <strong>{confirmSuppr.nom} {confirmSuppr.prenom}</strong>
            </p>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center mb-5">
              ⚠️ Cette action est irréversible. Toutes les données associées (RDV, prestations, interactions) seront supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSuppr(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => supprimer(confirmSuppr)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <ModalNouveauClient
          onClose={() => setModal(false)}
          onSaved={(id) => { setModal(false); navigate(`/clients/${id}`) }}
        />
      )}
    </div>
  )
}