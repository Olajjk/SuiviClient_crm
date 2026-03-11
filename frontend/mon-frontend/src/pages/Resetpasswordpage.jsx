import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { uid, token } = useParams()
  const navigate        = useNavigate()
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)

  const submit = async () => {
    if (password.length < 8) return toast.error('Minimum 8 caractères')
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      await authAPI.resetPassword(uid, token, password)
      toast.success('Mot de passe mis à jour !')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-500 mb-6">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>

        {[['Nouveau mot de passe', password, setPassword], ['Confirmer', confirm, setConfirm]].map(([label, val, set], i) => (
          <div key={i} className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={val}
                onChange={(e) => set(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 pr-10"
              />
              {i === 0 && (
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPass ? 'Cacher' : 'Voir'}
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  )
}