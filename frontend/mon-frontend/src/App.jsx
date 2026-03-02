import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import Layout        from './components/layout'        // ← ajouter
import DashboardPage from './pages/Dashboardpage'      // ← ajouter

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Pages publiques */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Pages protégées — TOUTES dans Layout */}
        {/* Layout contient la sidebar + le header */}
        {/* Les pages s'affichent dans <Outlet /> de Layout */}
        <Route path="/" element={<Layout />}>

          {/* index = affiché quand l'URL est exactement "/" */}
          <Route index element={<DashboardPage />} />

        </Route>

        {/* URL inconnue → login */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </AuthProvider>
  )
}
