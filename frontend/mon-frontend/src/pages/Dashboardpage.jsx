// ─────────────────────────────────────────────────────────────
//  DashboardPage.jsx  —  Tableau de bord
//  Affiche les statistiques + prochains RDV + dernières interactions
// ─────────────────────────────────────────────────────────────

// useState  : stocke les données (stats, rdvs, interactions)
// useEffect : charge les données quand la page s'ouvre
import { useState, useEffect } from 'react'

// Link : lien cliquable sans recharger la page
import { Link } from 'react-router-dom'

// Icônes depuis lucide-react
import { Users, MessageSquare, Calendar, TrendingUp, ArrowRight } from 'lucide-react'

// format : formate les dates (ex: "28 février 2026")
// fr     : langue française pour les dates
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'


// ─────────────────────────────────────────────────────────────
//  Composant StatCard — une carte de statistique
//  Reçoit : label (titre), value (chiffre), icon (icône), sub (sous-titre)
//
//  Utilisation :
//  <StatCard label="Total clients" value={42} icon={Users} sub="12 actifs" />
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, sub }) {
  // icon: Icon → on renomme "icon" en "Icon"
  // obligatoire car les composants React commencent par une majuscule

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">

        {/* Textes à gauche */}
        <div>
          <p className="text-sm text-gray-500">{label}</p>

          {/* Le grand chiffre */}
          {/* ?? '—' = si value est null ou undefined, affiche un tiret */}
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>

          {/* Sous-titre — affiché seulement s'il existe */}
          {/* sub && = "affiche seulement si sub n'est pas vide" */}
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>

        {/* Icône à droite */}
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-gray-700" />
        </div>

      </div>
    </div>
  )
}


// Couleurs des badges selon le statut du RDV
const COULEURS_STATUT = {
  planifie: 'bg-blue-50 text-blue-700',
  confirme: 'bg-green-50 text-green-700',
  effectue: 'bg-gray-100 text-gray-500',
  annule:   'bg-red-50 text-red-600',
  reporte:  'bg-yellow-50 text-yellow-700',
}


// ─────────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {

  // ── États ────────────────────────────────────────────────
  // stats = les chiffres (total clients, rdv à venir, etc.)
  const [stats, setStats] = useState(null)

  // rdvs = liste des prochains rendez-vous
  const [rdvs, setRdvs] = useState([])

  // interactions = liste des dernières interactions
  const [interactions, setInteractions] = useState([])

  // loading = true pendant que les données se chargent
  const [loading, setLoading] = useState(true)


  // ── useEffect ─────────────────────────────────────────────
  // [] = exécuté UNE SEULE FOIS quand la page s'affiche
  useEffect(() => {

    // On appelle l'API Django pour récupérer les données
    // Remplacez par vos vrais appels API quand le backend est prêt
    // Exemple avec de vraies données :
    // dashboardAPI.stats().then(({ data }) => setStats(data))

    // ── DONNÉES DE TEST (à remplacer par vos vrais appels API) ──
    // Ces données simulent ce que Django renverrait
    setTimeout(() => {

      // Simule les statistiques
      setStats({
        clients: {
          total:    24,   // nombre total de clients
          actifs:   12,   // clients avec interactions récentes
          prospects: 8,   // clients jamais contactés
        },
        interactions: {
          ce_mois: 15,    // interactions ce mois-ci
          total:   87,    // total depuis le début
        },
        rdv: {
          a_venir: 5,     // rdv planifiés dans le futur
          total:   32,    // total depuis le début
        }
      })

      // Simule les prochains RDV
      setRdvs([
        { id: 1, titre: 'Réunion de suivi',    client_nom: 'Marie Dupont',  date_debut: '2026-03-05T10:00:00', statut: 'confirme' },
        { id: 2, titre: 'Présentation offre',  client_nom: 'Jean Martin',   date_debut: '2026-03-07T14:30:00', statut: 'planifie' },
        { id: 3, titre: 'Point mensuel',       client_nom: 'Sara Kouassi',  date_debut: '2026-03-10T09:00:00', statut: 'planifie' },
      ])

      // Simule les dernières interactions
      setInteractions([
        { id: 1, sujet: 'Appel de découverte',  client_nom: 'Paul Adjovi',   type_interaction: 'appel' },
        { id: 2, sujet: 'Envoi de devis',        client_nom: 'Marie Dupont',  type_interaction: 'email' },
        { id: 3, sujet: 'Visite sur site',       client_nom: 'Jean Martin',   type_interaction: 'visite' },
      ])

      // Fin du chargement
      setLoading(false)

    }, 800) // simule 800ms de délai réseau

  }, []) // [] = ne se relance jamais, juste au premier affichage


  // ── Affichage pendant le chargement ───────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {/* Spinner : cercle qui tourne */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }


  // ── Rendu principal ────────────────────────────────────────
  return (
    // space-y-6 = espace vertical de 24px entre chaque bloc
    <div className="space-y-6">

      {/* ── Titre de la page ────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        {/* Affiche la date du jour en français : "lundi 2 mars 2026" */}
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* ── Les 4 cartes de statistiques ────────────────── */}
      {/* grid = affichage en grille */}
      {/* grid-cols-2 = 2 colonnes par défaut */}
      {/* lg:grid-cols-4 = 4 colonnes sur grand écran */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          label="Total clients"
          value={stats?.clients?.total}
          icon={Users}
          sub={`${stats?.clients?.actifs} actifs`}
          // ?.  = accède à .clients seulement si stats n'est pas null
        />

        <StatCard
          label="Prospects"
          value={stats?.clients?.prospects}
          icon={TrendingUp}
        />

        <StatCard
          label="Interactions ce mois"
          value={stats?.interactions?.ce_mois}
          icon={MessageSquare}
          sub={`${stats?.interactions?.total} total`}
        />

        <StatCard
          label="RDV à venir"
          value={stats?.rdv?.a_venir}
          icon={Calendar}
          sub={`${stats?.rdv?.total} total`}
        />

      </div>


      {/* ── Les deux tableaux ────────────────────────────── */}
      {/* Côte à côte sur grand écran, l'un sous l'autre sur mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">


        {/* ── Prochains rendez-vous ───────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

          {/* En-tête du tableau */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Prochains rendez-vous</h2>
            {/* Lien vers la page complète */}
            <Link to="/rendez-vous" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {/* Liste des RDV */}
          <div className="divide-y divide-gray-50">

            {/* Si aucun RDV */}
            {rdvs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucun rendez-vous à venir
              </p>
            )}

            {/* Boucle sur chaque RDV */}
            {rdvs.map(rdv => (
              <div key={rdv.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">

                {/* Mini calendrier avec le jour et le mois */}
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-xs leading-none">
                    {format(new Date(rdv.date_debut), 'dd')}
                    {/* 'dd' = le jour en 2 chiffres : 05, 12, 28 */}
                  </span>
                  <span className="text-blue-400 text-xs leading-none mt-0.5">
                    {format(new Date(rdv.date_debut), 'MMM', { locale: fr })}
                    {/* 'MMM' = mois abrégé : jan, fév, mar */}
                  </span>
                </div>

                {/* Titre et nom du client */}
                <div className="flex-1 min-w-0">
                  {/* truncate = coupe le texte avec "..." si trop long */}
                  <p className="text-sm font-medium text-gray-800 truncate">{rdv.titre}</p>
                  <p className="text-xs text-gray-400">{rdv.client_nom}</p>
                </div>

                {/* Badge statut */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${COULEURS_STATUT[rdv.statut] || 'bg-gray-100 text-gray-500'}`}>
                  {rdv.statut}
                </span>

              </div>
            ))}
          </div>
        </div>


        {/* ── Dernières interactions ──────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Dernières interactions</h2>
            <Link to="/interactions" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">

            {interactions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucune interaction enregistrée
              </p>
            )}

            {interactions.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">

                {/* Icône type d'interaction */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={16} className="text-gray-500" />
                </div>

                {/* Sujet et client */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.sujet}</p>
                  <p className="text-xs text-gray-400">
                    {item.client_nom} · {item.type_interaction}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}