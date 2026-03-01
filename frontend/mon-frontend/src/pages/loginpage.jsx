import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import monImage from '../assets/téléchargement (36).jpg'

export default function LoginPage() {

  const navigate = useNavigate()
  const { login } = useAuth()

  // Valeurs des deux champs
  const [form, setForm] = useState({ email: '', password: '' })

  // true = mot de passe visible | false = masqué
  const [showPwd, setShowPwd] = useState(false)

  // true = appel API en cours
  const [loading, setLoading] = useState(false)

  // Met à jour le champ modifié sans toucher aux autres
  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Soumission du formulaire
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Connexion réussie !')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ═══════════════════════════
          GAUCHE — Image seule, pas de texte
      ═══════════════════════════ */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={monImage}
          alt="SuiviClient"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* ═══════════════════════════
          DROITE — Formulaire
          Fond légèrement gris pour sentir la séparation avec l'image
      ═══════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-12 py-10 bg-gray-50 overflow-y-auto">

        {/* Nom de l'application en haut du formulaire */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600">SuiviClient</h2>
          <p className="text-gray-400 text-sm mt-0.5">Gestion de la relation client</p>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Connectez-vous
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Accédez à votre espace de gestion clients
        </p>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-5 max-w-sm">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 select-none">✉</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                required
                placeholder="Votre adresse email"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Mot de passe</label>
              <button type="button" className="text-xs text-blue-500 hover:underline">
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 select-none">🔒</span>
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handle}
                required
                placeholder="Votre mot de passe"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-10 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Se connecter
          </button>

          {/* Lien inscription — EN BAS du bouton */}
          <p className="text-sm text-gray-500 text-center pt-1">
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Inscrivez-vous
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}