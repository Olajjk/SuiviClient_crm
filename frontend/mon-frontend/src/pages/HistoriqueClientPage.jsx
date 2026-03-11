import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { clientAPI } from '../api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function HistoriqueClientPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [client,     setClient]     = useState(null)
  const [historique, setHistorique] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      clientAPI.get(id),
      clientAPI.historique(id),
    ]).then(([c, h]) => {
      setClient(c.data)
      setHistorique(h.data.results ?? h.data)
    }).catch(() => toast.error('Erreur de chargement'))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/clients/${id}`)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Historique</h1>
          {client && <p className="text-sm text-gray-500">{client.nom} {client.prenom || ''}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {historique.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Clock size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucune activité enregistrée</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
            {historique.map(h => (
              <div key={h.id} className="relative flex gap-4 pb-5">
                <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-gray-700">{h.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {h.utilisateur_nom || 'Système'} · {format(new Date(h.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}