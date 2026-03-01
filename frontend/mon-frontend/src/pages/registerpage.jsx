import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import monImage from '../assets/téléchargement (36).jpg'

export default function RegisterPage() {

  const navigate = useNavigate()
  const { register } = useAuth()

  // Tous les champs dans un seul objet
  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    password:   '',
    password2:  ''
  })

  // Un état par champ mot de passe (deux boutons œil séparés)
  const [showPwd,  setShowPwd]  = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)

  // true = appel API en cours
  const [loading, setLoading] = useState(false)

  // Met à jour le champ modifié
  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Soumission du formulaire
  const submit = async (e) => {
    e.preventDefault()

    // Vérifications avant d'appeler l'API
    if (form.password !== form.password2) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      await register(form)
      toast.success('Compte créé ! Bienvenue 🎉')
      navigate('/')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error("Erreur lors de la création du compte")
      }
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
          Fond gris clair pour différencier visuellement les deux côtés
      ═══════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-12 py-8 bg-gray-50 overflow-y-auto">

        {/* Nom de l'application */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-600">SuiviClient</h2>
          <p className="text-gray-400 text-sm mt-0.5">Gestion de la relation client</p>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Créez votre compte
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Commencez gratuitement dès aujourd'hui
        </p>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-4 max-w-sm">

          {/* Prénom + Nom côte à côte */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handle}
                required
                placeholder="Jean"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handle}
                required
                placeholder="Dupont"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe * <span className="text-gray-400 font-normal text-xs">(min. 8 caractères)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 select-none">🔒</span>
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handle}
                required
                minLength={8}
                placeholder="Choisissez un mot de passe"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-10 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 select-none">🔒</span>
              <input
                type={showPwd2 ? 'text' : 'password'}
                name="password2"
                value={form.password2}
                onChange={handle}
                required
                placeholder="Répétez votre mot de passe"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-10 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPwd2(!showPwd2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Indicateur vert/rouge en temps réel */}
            {form.password2 !== '' && (
              <p className={`text-xs mt-1.5 ${form.password === form.password2 ? 'text-green-600' : 'text-red-500'}`}>
                {form.password === form.password2
                  ? '✓ Les mots de passe correspondent'
                  : '✗ Les mots de passe ne correspondent pas'}
              </p>
            )}
          </div>

          {/* Bouton créer le compte */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Créer mon compte
          </button>

          {/* Lien connexion — EN BAS du bouton */}
          <p className="text-sm text-gray-500 text-center pt-1">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Connectez-vous
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}