import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Heart, Send, Bot, User, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { fidelisationAPI, clientAPI } from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const CANAUX_COULEURS = {
  email:    'bg-blue-50 text-blue-700',
  sms:      'bg-green-50 text-green-700',
  whatsapp: 'bg-emerald-50 text-emerald-700',
}

const VARIABLES = ['{{nom}}', '{{prenom}}', '{{code}}', '{{ville}}']
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

// Nettoie le HTML pour afficher un aperçu lisible
function apercu(contenu) {
  if (!contenu) return ''
  return contenu
    .replace(/<[^>]*>/g, ' ')   // retire les balises HTML
    .replace(/\s+/g, ' ')        // collapse les espaces
    .trim()
    .slice(0, 120)
}

function ModalMessage({ onClose, onSaved }) {
  const [form, setForm]       = useState({ client: '', type_message: 'remerciement', canal: 'email', sujet: '', contenu: '' })
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const inserer = v => setForm(p => ({ ...p, contenu: p.contenu + v }))

  useEffect(() => {
    clientAPI.list({ page_size: 200 }).then(r => setClients(r.data.results ?? r.data))
  }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await fidelisationAPI.create(form)
      toast.success('Message envoyé !')
      onSaved()
    } catch { toast.error('Erreur envoi') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Envoyer un message</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client *</label>
            <select name="client" value={form.client} onChange={handle} required className={inputCls}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select name="type_message" value={form.type_message} onChange={handle} className={inputCls}>
                {['anniversaire','promotion','relance','remerciement','nouveaute','autre'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
              <select name="canal" value={form.canal} onChange={handle} className={inputCls}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          {form.canal === 'email' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sujet</label>
              <input name="sujet" value={form.sujet} onChange={handle} className={inputCls} />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Message *</label>
              <div className="flex gap-1">
                {VARIABLES.map(v => (
                  <button type="button" key={v} onClick={() => inserer(v)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded text-gray-500 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea name="contenu" value={form.contenu} onChange={handle} required rows={4}
              placeholder="Tapez votre message... Utilisez {{nom}} pour personnaliser"
              className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              <Send size={14} /> {loading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FidelisationPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [canal,   setCanal]   = useState('')
  const [filtre,       setFiltre]       = useState('tous') // 'tous' | 'manuel' | 'auto' | 'echec'
  const [bandeauFerme, setBandeauFerme] = useState(() => {
    // On retient si l'utilisateur a fermé le bandeau pendant cette session
    return sessionStorage.getItem('fidelisation_bandeau_ferme') === 'true'
  })

  const fermerBandeau = () => {
    sessionStorage.setItem('fidelisation_bandeau_ferme', 'true')
    setBandeauFerme(true)
  }

  // Réouvrir le bandeau si de nouveaux échecs arrivent (nouvelle session)
  useEffect(() => {
    if (items.length > 0) {
      const nbEchecActuel = items.filter(m => !m.succes).length
      const nbEchecConnu  = parseInt(sessionStorage.getItem('fidelisation_nb_echec') || '0')
      if (nbEchecActuel > nbEchecConnu) {
        sessionStorage.removeItem('fidelisation_bandeau_ferme')
        setBandeauFerme(false)
      }
      sessionStorage.setItem('fidelisation_nb_echec', String(nbEchecActuel))
    }
  }, [items])
  const [modal,   setModal]   = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await fidelisationAPI.list({ canal })
      setItems(data.results ?? data)
    } catch { toast.error('Erreur') } finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [canal])

  const itemsFiltres = items.filter(m => {
    if (filtre === 'manuel') return !m.auto
    if (filtre === 'auto')   return m.auto
    if (filtre === 'echec')  return !m.succes
    return true
  })

  const nbEchec  = items.filter(m => !m.succes).length
  const nbAuto   = items.filter(m => m.auto).length
  const nbManuel = items.filter(m => !m.auto).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fidélisation</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} message(s) envoyé(s)</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nouveau message
        </button>
      </div>

      {/* Alerte si des envois en échec */}
      {nbEchec > 0 && !bandeauFerme && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {nbEchec} message{nbEchec > 1 ? 's' : ''} en échec
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Les envois automatiques échouent si l'adresse email du client n'est pas valide, 
              ou si SendGrid est indisponible. Vérifiez les emails de vos clients.
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => setFiltre('echec')} className="text-xs text-red-700 underline">
              Voir les échecs
            </button>
            <button onClick={fermerBandeau} className="text-xs text-red-400 hover:text-red-600">
              Ne plus afficher
            </button>
          </div>
        </div>
      )}

      {/* Filtres canal */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[{v:'',l:'Tous'},{v:'email',l:'Email'},{v:'sms',l:'SMS'},{v:'whatsapp',l:'WhatsApp'}].map(f => (
            <button key={f.v} onClick={() => setCanal(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${canal === f.v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[
            { v: 'tous',   l: 'Tous' },
            { v: 'manuel', l: `Manuels (${nbManuel})` },
            { v: 'auto',   l: `Automatiques (${nbAuto})` },
            { v: 'echec',  l: `Échecs (${nbEchec})` },
          ].map(f => (
            <button key={f.v} onClick={() => setFiltre(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtre === f.v
                  ? f.v === 'echec' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : itemsFiltres.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Heart size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun message{filtre !== 'tous' ? ' dans cette catégorie' : ''}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {itemsFiltres.map(m => (
              <div key={m.id} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50">

                {/* Icône auto vs manuel */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.auto ? 'bg-violet-50' : 'bg-pink-50'}`}>
                  {m.auto
                    ? <Bot size={15} className="text-violet-500" />
                    : <User size={15} className="text-pink-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p className="text-sm font-medium text-gray-800">
                      {m.sujet && !m.sujet.startsWith('<') ? m.sujet : m.type_message}
                    </p>
                    {/* Statut envoi */}
                    {m.succes
                      ? <span className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={10} /> Envoyé
                        </span>
                      : <span className="inline-flex items-center gap-0.5 text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded">
                          <AlertCircle size={10} /> Échec
                        </span>
                    }
                    {/* Auto ou manuel */}
                    {m.auto
                      ? <span className="text-xs bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded">Automatique</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Manuel</span>
                    }
                  </div>

                  <p className="text-xs text-gray-400">
                    <Link to={`/clients/${m.client}`} className="hover:text-blue-600 hover:underline">
                      {m.client_nom}
                    </Link>
                    {' · '}{format(new Date(m.envoye_le), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>

                  {/* Aperçu du contenu propre (sans HTML) */}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {apercu(m.contenu) || '—'}
                  </p>

                  {/* Raison échec si disponible */}
                  {!m.succes && m.erreur && (
                    <p className="text-xs text-red-400 mt-0.5 italic">{m.erreur}</p>
                  )}
                </div>

                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CANAUX_COULEURS[m.canal] || 'bg-gray-100 text-gray-500'}`}>
                  {m.canal}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <ModalMessage onClose={() => setModal(false)} onSaved={() => { setModal(false); charger() }} />}
    </div>
  )
}