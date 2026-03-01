// ─────────────────────────────────────────────────────────────
//  AuthContext.jsx  —  Gestion de la session utilisateur
//  Ce fichier fournit login(), logout(), register() et user
//  à TOUTE l'application via le Context React
// ─────────────────────────────────────────────────────────────

// createContext : crée le "canal de diffusion" global
// useContext    : permet à un composant de lire ce canal
// useState      : stocke les données (user, loading)
// useEffect     : exécute du code au démarrage de l'app
import { createContext, useContext, useState, useEffect } from 'react'

// axios : librairie pour faire des appels HTTP vers Django
import axios from 'axios'


// ── Création du contexte ──────────────────────────────────────
// null = valeur par défaut si on est en dehors du Provider
const AuthContext = createContext(null)


// ── Instance axios configurée ─────────────────────────────────
// Toutes les requêtes vers le backend passent par ici
const api = axios.create({
  // Remplacez par l'URL de votre backend Django
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Intercepteur : ajoute automatiquement le token à chaque requête
// Comme ça, pas besoin de le mettre à la main dans chaque appel
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


// ── AuthProvider ──────────────────────────────────────────────
// C'est le composant qui FOURNIT les données à toute l'app
// Il doit envelopper toute l'application dans main.jsx ou App.jsx
export function AuthProvider({ children }) {

  // user = l'objet utilisateur connecté, ou null si pas connecté
  const [user, setUser] = useState(null)

  // loading = true pendant qu'on vérifie le token au démarrage
  // Évite de rediriger vers /login alors qu'on est connecté
  const [loading, setLoading] = useState(true)


  // ── Vérification au démarrage ─────────────────────────────
  // [] = exécuté UNE SEULE FOIS quand l'app se lance
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      // Un token existe → on demande au backend qui on est
      api.get('/auth/me/')
        .then(({ data }) => {
          setUser(data)       // token valide → on est connecté
        })
        .catch(() => {
          localStorage.clear() // token invalide → on efface tout
        })
        .finally(() => {
          setLoading(false)   // dans tous les cas → fin du chargement
        })
    } else {
      // Pas de token → pas connecté
      setLoading(false)
    }
  }, [])


  // ── login() ───────────────────────────────────────────────
  // Appelée depuis LoginPage quand on clique "Se connecter"
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    // data contient : { access, refresh, user }

    // Sauvegarde les tokens dans le navigateur
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)

    // Met à jour l'état → tous les composants qui utilisent user
    // se réaffichent automatiquement
    setUser(data.user)

    return data.user
  }


  // ── register() ────────────────────────────────────────────
  // Appelée depuis RegisterPage quand on clique "Créer mon compte"
  const register = async (formData) => {
    const { data } = await api.post('/auth/register/', formData)

    // Même chose qu'après un login : on sauvegarde et on connecte
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)

    setUser(data.user)
    return data.user
  }


  // ── logout() ──────────────────────────────────────────────
  // Appelée depuis Layout quand on clique "Déconnexion"
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      // Dit au backend d'invalider le token (blacklist)
      await api.post('/auth/logout/', { refresh })
    } catch {
      // Même si ça échoue côté serveur, on déconnecte quand même
    }

    localStorage.clear()  // efface les tokens du navigateur
    setUser(null)         // user=null → PrivateRoute redirige vers /login
  }


  // ── Ce qu'on "diffuse" à toute l'application ──────────────
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
      {/* children = tout ce qui est enveloppé par <AuthProvider> */}
    </AuthContext.Provider>
  )
}


// ── useAuth() ─────────────────────────────────────────────────
// Raccourci pour utiliser le contexte dans n'importe quel composant
// Au lieu d'écrire useContext(AuthContext), on écrit juste useAuth()
// Exemple : const { user, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)