import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Users, MessageSquare, Calendar, CalendarDays, Heart, Zap, LogOut, Briefcase, User, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../api'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/clients',      icon: Users,           label: 'Clients' },
  { to: '/prestations',  icon: Briefcase,       label: 'Prestations' },
  { to: '/interactions', icon: MessageSquare,   label: 'Interactions' },
  { to: '/rendez-vous',  icon: Calendar,        label: 'Rendez-vous' },
  { to: '/calendrier',   icon: CalendarDays,    label: 'Calendrier' },
  { to: '/fidelisation', icon: Heart,           label: 'Fidélisation' },
  { to: '/campagnes',    icon: Zap,             label: 'Campagnes' },
]

function ClochNotifications() {
  const [notifs,  setNotifs]  = useState([])
  const [ouvert,  setOuvert]  = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await notificationsAPI.get()
        setNotifs(data.notifications || [])
      } catch { /* silencieux */ }
    }
    charger()
    const interval = setInterval(charger, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOuvert(!ouvert)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={18} className="text-gray-500" />
        {notifs.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {notifs.length > 9 ? '9+' : notifs.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Aujourd'hui</p>
            <span className="text-xs text-gray-400">{notifs.length} événement{notifs.length > 1 ? 's' : ''}</span>
          </div>
          {notifs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Aucun événement prévu aujourd'hui</p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {notifs.map((n, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'rdv' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.titre}</p>
                    <p className="text-xs text-gray-400">{n.client} · {n.heure}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block ${n.type === 'rdv' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {n.type === 'rdv' ? 'RDV' : 'Interaction'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const initiales = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()

  const confirmerDeconnexion = async () => {
    await logout()
    toast.success('Déconnecté !')
    navigate('/login')
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-60 bg-slate-900 flex flex-col">
          <div className="px-5 py-5 border-b border-white/10">
            <h1 className="text-white font-bold text-lg">SuiviClient</h1>
            <p className="text-slate-400 text-xs mt-0.5">CRM</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ' +
                  (isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white')
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10">
            <NavLink to="/profil"
              className={({ isActive }) =>
                'flex items-center gap-3 px-4 py-3 transition-colors ' +
                (isActive ? 'bg-white/10' : 'hover:bg-white/5')
              }
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{initiales}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
              </div>
              <User size={14} className="text-slate-400 flex-shrink-0" />
            </NavLink>
            <button onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors">
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-end gap-4">
            <div className="flex items-center gap-3">
              <ClochNotifications />
              <p className="text-sm text-gray-500">Bonjour, <span className="font-medium text-gray-800">{user?.first_name}</span></p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <LogOut size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Se déconnecter ?</h2>
              <p className="text-sm text-gray-500 mt-1">Vous allez quitter votre espace de travail.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={confirmerDeconnexion}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}