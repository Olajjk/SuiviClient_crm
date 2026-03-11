import { useState, useEffect } from 'react'
import { Plus, Zap, Play, BarChart2 } from 'lucide-react'
import { campagneAPI } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function ModalCampagne({ onClose, onSaved }) {
  const [form, setForm] = useState({ nom:'', type_campagne:'promotion', sujet:'', contenu:'', statut:'active', seuil_interactions:3, jours_inactivite:60 })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const VARIABLES = ['{{nom}}','{{prenom}}','{{code}}','{{ville}}']
  const inserer = v => setForm(p => ({ ...p, contenu: p.contenu + v }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await campagneAPI.create(form)
      toast.success('Campagne créée !')
      onSaved()
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle campagne</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
            <input name="nom" value={form.nom} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select name="type_campagne" value={form.type_campagne} onChange={handle}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="promotion">Promotion</option>
                <option value="relance">Relance</option>
                <option value="nouveaute">Nouveautés</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select name="statut" value={form.statut} onChange={handle}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {form.type_campagne === 'promotion' && (
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <label className="block text-sm font-medium text-blue-800 mb-1.5">Seuil d'interactions minimum</label>
              <input type="number" name="seuil_interactions" value={form.seuil_interactions} onChange={handle} min="1"
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-600 mt-1">Cible les clients avec au moins {form.seuil_interactions} interaction(s)</p>
            </div>
          )}
          {form.type_campagne === 'relance' && (
            <div className="bg-orange-50 rounded-lg px-4 py-3">
              <label className="block text-sm font-medium text-orange-800 mb-1.5">Jours d'inactivité</label>
              <input type="number" name="jours_inactivite" value={form.jours_inactivite} onChange={handle} min="1"
                className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <p className="text-xs text-orange-600 mt-1">Cible les clients sans interaction depuis {form.jours_inactivite} jours</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet email *</label>
            <input name="sujet" value={form.sujet} onChange={handle} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Contenu *</label>
              <div className="flex gap-1">
                {VARIABLES.map(v => (
                  <button type="button" key={v} onClick={() => inserer(v)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded text-gray-500">{v}</button>
                ))}
              </div>
            </div>
            <textarea name="contenu" value={form.contenu} onChange={handle} required rows={5}
              placeholder="Contenu de l'email... Utilisez {{nom}} pour personnaliser"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {loading ? 'Création...' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CampagnesPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [detail,  setDetail]  = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await campagneAPI.list()
      setItems(data.results ?? data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  const executer = async (id, nom, e) => {
    e.stopPropagation()
    try {
      await campagneAPI.executer(id)
      toast.success(`Campagne "${nom}" lancée !`)
    } catch { toast.error('Erreur') }
  }

  const executerToutes = async () => {
    try {
      await campagneAPI.executerToutes()
      toast.success('Toutes les campagnes actives lancées !')
    } catch { toast.error('Erreur') }
  }

  const TYPE_COULEURS = { promotion:'bg-blue-50 text-blue-700', relance:'bg-orange-50 text-orange-700', nouveaute:'bg-purple-50 text-purple-700' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} campagne(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={executerToutes}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
            <Play size={14} /> Tout exécuter
          </button>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Nouvelle campagne
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 bg-white rounded-xl border"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border"><Zap size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune campagne</p></div>
        ) : items.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50" onClick={() => setDetail(detail?.id === c.id ? null : c)}>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{c.nom}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COULEURS[c.type_campagne] || 'bg-gray-100 text-gray-500'}`}>{c.type_campagne}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.statut === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{c.statut}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.nb_envois_total} envoi(s) total
                  {c.derniere_execution && ` · Dernière exécution : ${format(new Date(c.derniere_execution), 'dd/MM/yyyy HH:mm', { locale: fr })}`}
                </p>
              </div>
              <button onClick={(e) => executer(c.id, c.nom, e)} disabled={c.statut !== 'active'}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg text-xs font-medium transition-colors">
                <Play size={12} /> Exécuter
              </button>
            </div>
            {detail?.id === c.id && (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-gray-400 mb-0.5">Sujet</p><p className="text-gray-800">{c.sujet}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Statistiques</p>
                    <div className="flex items-center gap-2">
                      <BarChart2 size={14} className="text-blue-500" />
                      <p className="text-gray-800 font-semibold">{c.nb_envois_total} emails envoyés</p>
                    </div>
                  </div>
                  {c.type_campagne === 'promotion' && <div><p className="text-xs text-gray-400 mb-0.5">Seuil interactions</p><p className="text-gray-800">{c.seuil_interactions} minimum</p></div>}
                  {c.type_campagne === 'relance' && <div><p className="text-xs text-gray-400 mb-0.5">Inactivité</p><p className="text-gray-800">{c.jours_inactivite} jours</p></div>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Aperçu du contenu</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{c.contenu}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {modal && <ModalCampagne onClose={() => setModal(false)} onSaved={() => { setModal(false); charger() }} />}
    </div>
  )
}