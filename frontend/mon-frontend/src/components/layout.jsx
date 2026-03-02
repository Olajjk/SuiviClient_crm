// Un seul import — on prend Outlet ET NavLink ensemble
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, MessageSquare,
         Calendar, Heart, Zap } from 'lucide-react'

// Liste des liens — déclarée EN DEHORS du composant
// (elle ne change jamais, pas besoin de la recréer à chaque rendu)
const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/clients',      icon: Users,           label: 'Clients' },
  { to: '/interactions', icon: MessageSquare,   label: 'Interactions' },
  { to: '/rendez-vous',  icon: Calendar,        label: 'Rendez-vous' },
  { to: '/fidelisation', icon: Heart,           label: 'Fidélisation' },
  { to: '/campagnes',    icon: Zap,             label: 'Campagnes' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-slate-900 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="text-white font-bold text-lg">SuiviClient</h1>
          <p className="text-slate-400 text-xs mt-0.5">CRM</p>
        </div>

        {/* Navigation — boucle sur navItems */}
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

      </aside>

      {/* ── Zone droite ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center">
          <p className="text-sm text-gray-500">Bienvenue </p>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  )
}