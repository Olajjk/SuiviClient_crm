import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Briefcase, CheckCircle, Loader2 } from 'lucide-react'
import { prestationAPI, clientAPI } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUTS_COULEURS = { en_cours:'bg-yellow-50 text-yellow-700', termine:'bg-green-50 text-green-700', annule:'bg-red-50 text-red-600' }

function ModalPrestation({ onClose, onSaved }) {
  const [form, setForm] = useState({ client:'', nom:'', description:'', prix:'', reduction:'0', date_realisation:'', statut:'en_cours', notes:'' })
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  useEffect(() => { clientAPI.list({ page_size: 200 }).then(r => setClients(r.data.results ?? r.data)) }, [])

  const prixFinal = form.prix ? (parseFloat(form.prix) * (1 - parseFloat(form.reduction || 0) / 100)).toFixed(2) : '0.00'

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await prestationAPI.create(form)
      toast.success('Prestation créée !')
      onSaved()
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle prestation</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la prestation *</label>
            <input name="nom" value={form.nom} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (Fcfa) *</label>
              <input type="number" name="prix" value={form.prix} onChange={handle} required min="0" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Réduction (%)</label>
              <input type="number" name="reduction" value={form.reduction} onChange={handle} min="0" max="100" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.prix && (
            <div className="bg-green-50 rounded-lg px-4 py-3">
              <p className="text-sm text-green-800">Prix final : <strong>{prixFinal} Fcfa</strong>
                {parseFloat(form.reduction) > 0 && <span className="text-green-600 ml-2 text-xs">(-{form.reduction}%)</span>}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input type="date" name="date_realisation" value={form.date_realisation} onChange={handle} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select name="statut" value={form.statut} onChange={handle}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PrestationsPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statut,  setStatut]  = useState('')
  const [modal,   setModal]   = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await prestationAPI.list({ search, statut })
      setItems(data.results ?? data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [search, statut])

  const [terminerLoading, setTerminerLoading] = useState(null)
  const terminer = async (p) => {
    if (!confirm(`Marquer "${p.nom}" comme terminée ? Le client sera notifié.`)) return
    setTerminerLoading(p.id)
    try {
      await prestationAPI.update(p.id, { ...p, statut: 'termine' })
      toast.success('Prestation terminée — client notifié !')
      charger()
    } catch { toast.error('Erreur') } finally { setTerminerLoading(null) }
  }

  // Récap mensuel : regrouper les prestations terminées par mois
  const recapMensuel = items
    .filter(p => p.statut === 'termine')
    .reduce((acc, p) => {
      const mois = p.date_realisation?.slice(0, 7) // "2024-03"
      if (!mois) return acc
      if (!acc[mois]) acc[mois] = { count: 0, total: 0 }
      acc[mois].count += 1
      acc[mois].total += parseFloat(p.prix_final || 0)
      return acc
    }, {})
  const recapTrié = Object.entries(recapMensuel).sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prestations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} prestation(s)</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Nouvelle prestation
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[{v:'',l:'Tous'},{v:'en_cours',l:'En cours'},{v:'termine',l:'Terminé'},{v:'annule',l:'Annulé'}].map(f => (
            <button key={f.v} onClick={() => setStatut(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statut === f.v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* Récapitulatif mensuel */}
      {recapTrié.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Récapitulatif mensuel (prestations terminées)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recapTrié.map(([mois, data]) => {
              const [annee, m] = mois.split('-')
              const label = new Date(annee, parseInt(m) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              return (
                <div key={mois} className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 capitalize">{label}</p>
                  <p className="text-base font-bold text-gray-800 mt-0.5">{data.total.toLocaleString('fr-FR')} Fcfa</p>
                  <p className="text-xs text-gray-400">{data.count} prestation{data.count > 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Briefcase size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune prestation</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Prestation','Client','Date','Prix','Réduction','Prix final','Statut',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{p.nom}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/clients/${p.client}`} className="text-sm text-blue-600 hover:underline">{p.client_nom}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(p.date_realisation), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{parseFloat(p.prix).toLocaleString('fr-FR')} Fcfa</td>
                  <td className="px-4 py-3 text-sm text-green-600">{p.reduction > 0 ? `-${p.reduction}%` : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{parseFloat(p.prix_final).toLocaleString('fr-FR')} Fcfa</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUTS_COULEURS[p.statut] || 'bg-gray-100 text-gray-500'}`}>
                      {p.statut === 'en_cours' ? 'En cours' : p.statut === 'termine' ? 'Terminé' : 'Annulé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && <ModalPrestation onClose={() => setModal(false)} onSaved={() => { setModal(false); charger() }} />}
    </div>
  )
}