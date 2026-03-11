import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register:      (data)    => api.post('/auth/register/', data),
  login:         (e, p)    => api.post('/auth/login/', { email: e, password: p }),
  logout:        (refresh) => api.post('/auth/logout/', { refresh }),
  me:            ()        => api.get('/auth/me/'),
  getProfil:     ()        => api.get('/auth/profil/'),
  updateProfil:  (data)    => api.put('/auth/profil/', data),
  uploadAvatar:  (file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return api.post('/auth/avatar/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  motDePasseOublie: (email)        => api.post('/auth/mot-de-passe-oublie/', { email }),
  resetPassword:    (uid, token, password) => api.post('/auth/reset-password/', { uid, token, password }),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
}

export const rechercheAPI = {
  global: (q) => api.get('/recherche/', { params: { q } }),
}

export const notificationsAPI = {
  get: () => api.get('/notifications/'),
}

export const clientAPI = {
  list:       (params)     => api.get('/clients/', { params }),
  detail:     (id)         => api.get(`/clients/${id}/`),
  create:     (data)       => api.post('/clients/', data),
  update:     (id, data)   => api.put(`/clients/${id}/`, data),
  delete:     (id)         => api.delete(`/clients/${id}/`),
  historique: (id)         => api.get(`/clients/${id}/historique/`),
  pdf:        (id)         => api.get(`/clients/${id}/pdf/`, { responseType: 'blob' }),
  exportExcel: ()          => api.get('/clients/export/excel/', { responseType: 'blob' }),
}

export const interactionAPI = {
  list:   (params)   => api.get('/interactions/', { params }),
  detail: (id)       => api.get(`/interactions/${id}/`),
  create: (data)     => api.post('/interactions/', data),
  update: (id, data) => api.put(`/interactions/${id}/`, data),
  delete: (id)       => api.delete(`/interactions/${id}/`),
}

export const rdvAPI = {
  list:     (params)   => api.get('/rendez-vous/', { params }),
  detail:   (id)       => api.get(`/rendez-vous/${id}/`),
  create:   (data)     => api.post('/rendez-vous/', data),
  update:   (id, data) => api.put(`/rendez-vous/${id}/`, data),
  delete:   (id)       => api.delete(`/rendez-vous/${id}/`),
  notifier: (id)       => api.post(`/rendez-vous/${id}/notifier/`),
}

export const prestationAPI = {
  list:        (params)   => api.get('/prestations/', { params }),
  detail:      (id)       => api.get(`/prestations/${id}/`),
  create:      (data)     => api.post('/prestations/', data),
  update:      (id, data) => api.put(`/prestations/${id}/`, data),
  delete:      (id)       => api.delete(`/prestations/${id}/`),
  exportExcel: ()         => api.get('/prestations/export/excel/', { responseType: 'blob' }),
}

export const fidelisationAPI = {
  list:   (params) => api.get('/fidelisation/', { params }),
  detail: (id)     => api.get(`/fidelisation/${id}/`),
  create: (data)   => api.post('/fidelisation/', data),
  delete: (id)     => api.delete(`/fidelisation/${id}/`),
}

export const campagneAPI = {
  list:          (params)   => api.get('/campagnes/', { params }),
  detail:        (id)       => api.get(`/campagnes/${id}/`),
  create:        (data)     => api.post('/campagnes/', data),
  update:        (id, data) => api.put(`/campagnes/${id}/`, data),
  delete:        (id)       => api.delete(`/campagnes/${id}/`),
  executer:      (id)       => api.post(`/campagnes/${id}/executer/`),
  executerToutes: ()        => api.post('/campagnes/executer-toutes/'),
}

export const telechargerFichier = (blob, nom) => {
  const url  = window.URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href     = url
  lien.download = nom
  lien.click()
  window.URL.revokeObjectURL(url)
}

export const telechargerPDF = telechargerFichier