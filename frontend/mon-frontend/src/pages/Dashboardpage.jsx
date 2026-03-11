import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, MessageSquare, Calendar, TrendingUp, ArrowRight, Briefcase, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { dashboardAPI, prestationAPI } from '../api'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon: Icon, sub, couleur = 'blue', to }) {
  const couleurs = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    amber:  'bg-amber-50 text-amber-600',
  }
  const card = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${couleurs[couleur]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

const COULEURS_STATUT = {
  planifie: 'bg-blue-50 text-blue-700',
  confirme: 'bg-green-50 text-green-700',
  effectue: 'bg-gray-100 text-gray-500',
  annule:   'bg-red-50 text-red-600',
  reporte:  'bg-yellow-50 text-yellow-700',
}

export default function DashboardPage() {
  const [stats,            setStats]            = useState(null)
  const [rdvs,             setRdvs]             = useState([])
  const [interactions,     setInteractions]     = useState([])
  const [prestationsEC,    setPrestationsEC]    = useState([])
  const [loading,          setLoading]          = useState(true)
  const [terminerLoading,  setTerminerLoading]  = useState(null)

  const charger = () => {
    dashboardAPI.get()
      .then(({ data }) => {
        setStats(data.stats)
        setRdvs(data.prochains_rdv)
        setInteractions(data.dernieres_interactions)
        setPrestationsEC(data.prestations_en_cours ?? [])
      })
      .catch(() => toast.error('Erreur lors du chargement du tableau de bord'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  const terminer = async (p) => {
    if (!confirm(`Marquer "${p.nom}" comme terminée ?\nUn email sera envoyé automatiquement à ${p.client_nom}.`)) return
    setTerminerLoading(p.id)
    try {
      await prestationAPI.update(p.id, { ...p, statut: 'termine' })
      toast.success(`✅ "${p.nom}" terminée — ${p.client_nom} a été notifié`)
      charger()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setTerminerLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total clients"     value={stats?.clients?.total}
          icon={Users}              couleur="blue"
          sub={`${stats?.clients?.actifs ?? 0} actifs`}
          to="/clients"
        />
        <StatCard
          label="Prospects"         value={stats?.clients?.prospects}
          icon={TrendingUp}         couleur="purple"
          to="/clients"
        />
        <StatCard
          label="Interactions/mois" value={stats?.interactions?.ce_mois}
          icon={MessageSquare}      couleur="green"
          sub={`${stats?.interactions?.total ?? 0} total`}
          to="/interactions"
        />
        <StatCard
          label="RDV à venir"       value={stats?.rdv?.a_venir}
          icon={Calendar}           couleur="orange"
          sub={`${stats?.rdv?.total ?? 0} total`}
          to="/rendez-vous"
        />
      </div>

      {/* Alerte prestations en cours */}
      {(stats?.prestations?.en_cours ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <Briefcase size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats.prestations.en_cours} prestation{stats.prestations.en_cours > 1 ? 's' : ''} en cours</span>
            {' '}— pensez à les marquer terminées dès que le travail est livré.
          </p>
          <Link to="/prestations" className="ml-auto text-xs text-amber-700 hover:underline flex items-center gap-1 flex-shrink-0">
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Prochains RDV */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Prochains rendez-vous</h2>
            <Link to="/rendez-vous" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {rdvs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucun rendez-vous à venir</p>
            )}
            {rdvs.map(rdv => (
              <Link key={rdv.id} to="/rendez-vous"
                className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-xs leading-none">
                    {format(new Date(rdv.date_debut), 'dd')}
                  </span>
                  <span className="text-blue-400 text-xs leading-none mt-0.5">
                    {format(new Date(rdv.date_debut), 'MMM', { locale: fr })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{rdv.titre}</p>
                  <p className="text-xs text-gray-400">{rdv.client_nom}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize ${COULEURS_STATUT[rdv.statut] || 'bg-gray-100 text-gray-500'}`}>
                  {rdv.statut}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Dernières interactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Dernières interactions</h2>
            <Link to="/interactions" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {interactions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucune interaction enregistrée</p>
            )}
            {interactions.map(item => (
              <Link key={item.id} to="/interactions"
                className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.sujet}</p>
                  <p className="text-xs text-gray-400">{item.client_nom} · {item.type_interaction}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Prestations en cours */}
      {prestationsEC.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-amber-600" />
              <h2 className="font-semibold text-gray-900">Prestations en cours</h2>
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                {stats?.prestations?.en_cours}
              </span>
            </div>
            <Link to="/prestations" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {prestationsEC.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-gray-50">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.nom}</p>
                  <p className="text-xs text-gray-400">
                    <Link to={`/clients/${p.client}`} className="hover:text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                      {p.client_nom}
                    </Link>
                    {' · '}{p.prix_final} Fcfa
                  </p>
                </div>
                <button
                  onClick={() => terminer(p)}
                  disabled={terminerLoading === p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 opacity-0 group-hover:opacity-100"
                >
                  {terminerLoading === p.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <CheckCircle size={12} />}
                  Terminer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}