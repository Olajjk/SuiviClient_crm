// ─────────────────────────────────────────────────────────────
//  ProfilPage.jsx — Page de profil utilisateur
//  Voir + modifier ses infos + uploader une photo
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { Loader2, Camera, User, Lock, Save } from 'lucide-react'

export default function ProfilPage() {

  const { user, updateUser } = useAuth()

  // Données du formulaire infos
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
  })

  // Données du formulaire mot de passe
  const [mdp, setMdp] = useState({
    ancien_password:  '',
    nouveau_password: '',
    confirmation:     '',
  })

  const [loadingInfos, setLoadingInfos] = useState(false)
  const [loadingMdp,   setLoadingMdp]   = useState(false)
  const [loadingAvatar,setLoadingAvatar] = useState(false)

  // Preview de l'image avant upload
  const [preview, setPreview] = useState(user?.avatar_url || null)

  // Référence sur l'input file (caché)
  const inputRef = useRef(null)

  const handle = (e, setter) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── Sauvegarder les infos ─────────────────────────────────
  const sauvegarderInfos = async (e) => {
    e.preventDefault()
    setLoadingInfos(true)
    try {
      const { data } = await authAPI.updateProfil(form)
      updateUser(data)   // met à jour le user dans AuthContext
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoadingInfos(false)
    }
  }

  // ── Changer le mot de passe ───────────────────────────────
  const changerMotDePasse = async (e) => {
    e.preventDefault()

    if (mdp.nouveau_password !== mdp.confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (mdp.nouveau_password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères')
      return
    }

    setLoadingMdp(true)
    try {
      await authAPI.updateProfil({
        ancien_password:  mdp.ancien_password,
        nouveau_password: mdp.nouveau_password,
      })
      toast.success('Mot de passe modifié !')
      setMdp({ ancien_password: '', nouveau_password: '', confirmation: '' })
    } catch (err) {
      const msg = err.response?.data?.ancien_password?.[0] || 'Erreur'
      toast.error(msg)
    } finally {
      setLoadingMdp(false)
    }
  }

  // ── Upload avatar ─────────────────────────────────────────
  const handleFichier = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return

    // Affiche la prévisualisation immédiatement
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(fichier)

    // Envoie au backend
    setLoadingAvatar(true)
    try {
      const { data } = await authAPI.uploadAvatar(fichier)
      updateUser({ avatar_url: data.avatar_url })
      toast.success('Photo de profil mise à jour !')
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setLoadingAvatar(false)
    }
  }

  // Initiales pour l'avatar par défaut
  const initiales = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      {/* ── Section Avatar ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          Photo de profil
        </h2>

        <div className="flex items-center gap-5">

          {/* Avatar — photo ou initiales */}
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">{initiales}</span>
              </div>
            )}

            {/* Loader sur l'avatar pendant l'upload */}
            {loadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Bouton changer la photo */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-400 mb-3">{user?.email}</p>

            {/* input file caché — déclenché par le bouton */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFichier}
              className="hidden"
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={loadingAvatar}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Camera size={15} />
              Changer la photo
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG · max 5MB</p>
          </div>
        </div>
      </div>

      {/* ── Informations personnelles ───────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          Informations personnelles
        </h2>

        <form onSubmit={sauvegarderInfos} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={(e) => handle(e, setForm)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={(e) => handle(e, setForm)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) => handle(e, setForm)}
              placeholder="+229 61 00 00 00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
            <input
              value={user?.role || ''}
              disabled
              className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loadingInfos}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loadingInfos ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Sauvegarder
          </button>

        </form>
      </div>

      {/* ── Changer le mot de passe ─────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-blue-600" />
          Changer le mot de passe
        </h2>

        <form onSubmit={changerMotDePasse} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ancien mot de passe</label>
            <input
              type="password"
              name="ancien_password"
              value={mdp.ancien_password}
              onChange={(e) => handle(e, setMdp)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              name="nouveau_password"
              value={mdp.nouveau_password}
              onChange={(e) => handle(e, setMdp)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              name="confirmation"
              value={mdp.confirmation}
              onChange={(e) => handle(e, setMdp)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {mdp.confirmation !== '' && (
              <p className={`text-xs mt-1 ${mdp.nouveau_password === mdp.confirmation ? 'text-green-600' : 'text-red-500'}`}>
                {mdp.nouveau_password === mdp.confirmation ? '✓ Les mots de passe correspondent' : '✗ Ne correspondent pas'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingMdp}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loadingMdp ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Changer le mot de passe
          </button>

        </form>
      </div>

    </div>
  )
}