import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [envoye,  setEnvoye]  = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email.trim()) return toast.error('Entrez votre email')
    setLoading(true)
    try {
      await authAPI.motDePasseOublie(email.trim())
      setEnvoye(true)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (envoye) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé</h2>
        <p className="text-sm text-gray-500 mb-6">
          Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <Link to="/login" className="text-sm text-blue-600 hover:underline">Retour à la connexion</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-gray-500 mb-6">Entrez votre email pour recevoir un lien de réinitialisation.</p>

        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="vous@email.com"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-4"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          <Link to="/login" className="text-blue-600 hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}