import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import LoginPage          from './pages/loginpage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/Forgotpasswordpage'
import ResetPasswordPage  from './pages/Resetpasswordpage'
import DashboardPage      from './pages/Dashboardpage'
import ClientsPage        from './pages/Clientspage'
import ClientDetailPage   from './pages/ClientDetailpage'
import InteractionsPage   from './pages/Interactionspage'
import RendezVousPage     from './pages/RendezVousPage'
import CalendrierPage     from './pages/Calendrierpage'
import PrestationsPage    from './pages/PrestationsPage'
import FidelisationPage   from './pages/Fidelisationpage'
import CampagnesPage      from './pages/Campagnespage'
import ProfilPage          from './pages/Profilpage'
import HistoriqueClientPage from './pages/HistoriqueClientPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password/:uid/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index           element={<DashboardPage />} />
            <Route path="clients"  element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="interactions" element={<InteractionsPage />} />
            <Route path="rendez-vous"  element={<RendezVousPage />} />
            <Route path="calendrier"   element={<CalendrierPage />} />
            <Route path="prestations"  element={<PrestationsPage />} />
            <Route path="fidelisation" element={<FidelisationPage />} />
            <Route path="campagnes"    element={<CampagnesPage />} />
            <Route path="profil"         element={<ProfilPage />} />
            <Route path="clients/:id/historique" element={<HistoriqueClientPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}