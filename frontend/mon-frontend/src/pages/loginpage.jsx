import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import monImage from '../assets/téléchargement (36).jpg'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const submit = async (e) => {
    e?.preventDefault()
    if (!email || !password) return toast.error('Remplissez tous les champs')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* Gauche — Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={monImage}
          alt="SuiviClient"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white">
          <p className="text-2xl font-bold">SuiviClient</p>
          <p className="text-sm text-white/70 mt-1">Gestion de la relation client</p>
        </div>
      </div>

      {/* Droite — Formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-8 bg-gray-50">

        <div className="w-full max-w-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600 lg:hidden">SuiviClient</h2>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Connexion</h1>
          <p className="text-gray-400 text-sm mt-1">Accédez à votre espace SuiviClient</p>
        </div>

        <form onSubmit={submit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">✉</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm placeholder-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Mot de passe *</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-10 py-3 text-sm placeholder-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors mt-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-sm text-gray-500 text-center pt-1">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>

        </form>
        </div>
      </div>
    </div>
  )
}