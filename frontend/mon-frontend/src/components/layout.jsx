// ─────────────────────────────────────────────────────────────
//  Layout.jsx — Structure commune à toutes les pages protégées
//  Contient : sidebar gauche + header + zone contenu
// ─────────────────────────────────────────────────────────────

// Outlet   : affiche la page enfant (Dashboard, Clients, etc.)
// NavLink  : comme Link mais détecte si le lien est actif
// useNavigate : pour rediriger après déconnexion
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

// useState : pour afficher/cacher la popup de confirmation
import { useState } from 'react'

// Icônes du menu
import { LayoutDashboard, Users, MessageSquare,
         Calendar, Heart, Zap, LogOut } from 'lucide-react'

// useAuth : pour récupérer logout() et user
import { useAuth } from '../context/AuthContext'

// toast : notification après déconnexion
import toast from 'react-hot-toast'


// ── Liste des liens — EN DEHORS du composant ─────────────────
// Elle ne change jamais, pas besoin de la recréer à chaque rendu
const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/clients',      icon: Users,           label: 'Clients' },
  { to: '/interactions', icon: MessageSquare,   label: 'Interactions' },
  { to: '/rendez-vous',  icon: Calendar,        label: 'Rendez-vous' },
  { to: '/fidelisation', icon: Heart,           label: 'Fidélisation' },
  { to: '/campagnes',    icon: Zap,             label: 'Campagnes' },
]


export default function Layout() {

  // logout() = déconnecte l'utilisateur (efface les tokens)
  // user    = l'utilisateur connecté
  const { user, logout } = useAuth()

  // navigate = fonction pour changer de page
  const navigate = useNavigate()

  // showConfirm = true → la popup s'affiche | false → elle est cachée
  const [showConfirm, setShowConfirm] = useState(false)


  // Appelée quand on clique "Oui, me déconnecter"
  const confirmerDeconnexion = async () => {
    await logout()                  // déconnecte côté AuthContext
    toast.success('Déconnecté !')   // notification verte
    navigate('/login')              // redirige vers la page de connexion
  }


  // ── Rendu ──────────────────────────────────────────────────
  // IMPORTANT : le return ne peut contenir QU'UN SEUL élément racine
  // On utilise <> </> (fragment) pour envelopper la page ET la popup
  return (
    <>

      {/* ════════════════════════════════════════════════
          STRUCTURE PRINCIPALE : sidebar + zone droite
      ════════════════════════════════════════════════ */}
      <div className="flex h-screen bg-gray-50">


        {/* ── SIDEBAR ───────────────────────────────── */}
        <aside className="w-60 bg-slate-900 flex flex-col">

          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10">
            <h1 className="text-white font-bold text-lg">SuiviClient</h1>
            <p className="text-slate-400 text-xs mt-0.5">CRM</p>
          </div>

          {/* Navigation — flex-1 = prend tout l'espace disponible */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Bouton déconnexion — tout en bas de la sidebar */}
          <div className="px-3 py-4 border-t border-white/10">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>

        </aside>


        {/* ── ZONE DROITE : header + contenu ────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
            <div />
            <p className="text-sm text-gray-500">
              Bonjour, <span className="font-medium text-gray-800">{user?.first_name}</span> 👋
            </p>
          </header>

          {/* Contenu de la page — <Outlet /> = la page enfant s'affiche ici */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>

        </div>

      </div>


      {/* ════════════════════════════════════════════════
          POPUP de confirmation — EN DEHORS de la structure
          mais DANS le fragment <>
          fixed = se positionne par rapport à l'écran entier
          showConfirm && = s'affiche seulement si showConfirm = true
      ════════════════════════════════════════════════ */}
      {showConfirm && (

        // Fond sombre derrière la popup
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          {/* La carte blanche */}
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">

            {/* Icône + texte */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <LogOut size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Se déconnecter ?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vous allez quitter votre espace de travail.
              </p>
            </div>

            {/* Boutons Oui / Non */}
            <div className="flex gap-3">

              {/* Non — ferme la popup sans rien faire */}
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Non, rester
              </button>

              {/* Oui — déconnecte et redirige */}
              <button
                onClick={confirmerDeconnexion}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Oui, me déconnecter
              </button>

            </div>
          </div>
        </div>

      )}

    </>
  )
}