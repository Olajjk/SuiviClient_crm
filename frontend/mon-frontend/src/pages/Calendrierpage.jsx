import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { rdvAPI } from '../api'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUT_COULEURS = {
  planifie:  'bg-blue-500',
  confirme:  'bg-green-500',
  reporte:   'bg-yellow-500',
  annule:    'bg-red-400',
  effectue:  'bg-gray-400',
}

export default function CalendrierPage() {
  const [moisActuel, setMoisActuel] = useState(new Date())
  const [rdvs,       setRdvs]       = useState([])
  const [joursMap,   setJoursMap]   = useState({})
  const [selected,   setSelected]   = useState(null)
  const [rdvJour,    setRdvJour]    = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    rdvAPI.list().then(({ data }) => {
      const items = data.results ?? data
      setRdvs(items)
      const map = {}
      items.forEach(rdv => {
        const key = rdv.date_debut.slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(rdv)
      })
      setJoursMap(map)
    })
  }, [])

  const joursCalendrier = () => {
    const debut  = startOfWeek(startOfMonth(moisActuel), { weekStartsOn: 1 })
    const fin    = endOfWeek(endOfMonth(moisActuel),     { weekStartsOn: 1 })
    const jours  = []
    let courant  = debut
    while (courant <= fin) {
      jours.push(courant)
      courant = addDays(courant, 1)
    }
    return jours
  }

  const cliquerJour = (jour) => {
    setSelected(jour)
    const key = format(jour, 'yyyy-MM-dd')
    setRdvJour(joursMap[key] || [])
  }

  const jours = joursCalendrier()

  return (
    <div className="flex gap-5 h-full">
      {/* Calendrier */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header mois */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => setMoisActuel(subMonths(moisActuel, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900 capitalize">
            {format(moisActuel, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button onClick={() => setMoisActuel(addMonths(moisActuel, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Jours de semaine */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} className="py-2 text-center text-xs font-medium text-gray-400">{j}</div>
          ))}
        </div>

        {/* Grille jours */}
        <div className="grid grid-cols-7">
          {jours.map((jour, i) => {
            const key       = format(jour, 'yyyy-MM-dd')
            const rdvsJour  = joursMap[key] || []
            const actuel    = isSameMonth(jour, moisActuel)
            const aujourdhui = isToday(jour)
            const selectionne = selected && isSameDay(jour, selected)

            return (
              <button
                key={i}
                onClick={() => cliquerJour(jour)}
                className={`min-h-20 p-1.5 border-b border-r border-gray-50 text-left transition-colors
                  ${!actuel ? 'bg-gray-50/50' : 'hover:bg-blue-50/50'}
                  ${selectionne ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}
                `}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                  ${aujourdhui ? 'bg-blue-600 text-white' : actuel ? 'text-gray-700' : 'text-gray-300'}
                `}>
                  {format(jour, 'd')}
                </span>
                <div className="space-y-0.5">
                  {rdvsJour.slice(0, 3).map((rdv, j) => (
                    <div key={j}
                      className={`text-white text-xs px-1 py-0.5 rounded truncate ${STATUT_COULEURS[rdv.statut] || 'bg-blue-400'}`}>
                      {rdv.titre}
                    </div>
                  ))}
                  {rdvsJour.length > 3 && (
                    <p className="text-xs text-gray-400">+{rdvsJour.length - 3} autre{rdvsJour.length - 3 > 1 ? 's' : ''}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Panneau latéral */}
      <div className="w-72 flex flex-col gap-4">
        {/* Bouton nouveau RDV */}
        <button
          onClick={() => navigate('/rendez-vous')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Nouveau rendez-vous
        </button>

        {/* Détail du jour sélectionné */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">
              {selected
                ? format(selected, 'EEEE d MMMM', { locale: fr })
                : 'Sélectionnez un jour'}
            </p>
            {selected && <p className="text-xs text-gray-400 mt-0.5">{rdvJour.length} rendez-vous</p>}
          </div>

          <div className="overflow-y-auto p-4 space-y-3">
            {!selected && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar size={32} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Cliquez sur un jour pour voir les RDV</p>
              </div>
            )}
            {selected && rdvJour.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun rendez-vous ce jour</p>
            )}
            {rdvJour.map(rdv => (
              <div key={rdv.id}
                onClick={() => navigate('/rendez-vous')}
                className="cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUT_COULEURS[rdv.statut] || 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{rdv.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(rdv.date_debut), 'HH:mm')}
                      {rdv.lieu && ` · ${rdv.lieu}`}
                    </p>
                    {rdv.client_nom && (
                      <p className="text-xs text-blue-600 mt-0.5">{rdv.client_nom}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Légende</p>
          <div className="space-y-2">
            {[
              ['Planifié',  'bg-blue-500'],
              ['Confirmé',  'bg-green-500'],
              ['Reporté',   'bg-yellow-500'],
              ['Annulé',    'bg-red-400'],
              ['Effectué',  'bg-gray-400'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}