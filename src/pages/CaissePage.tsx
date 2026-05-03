import { useEffect, useState, useCallback } from 'react'
import { Session, Station } from '../types'
import StationGrid from '../components/station/StationGrid'

export default function CaissePage() {
  const [stations, setStations] = useState<Station[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [s, sess] = await Promise.all([
        window.playdesk.stations.list(),
        window.playdesk.sessions.active(),
      ])
      setStations(s)
      setSessions(sess)
      setLastRefresh(new Date().toLocaleTimeString('fr-MA'))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    // Refresh every 3s to sync server state (timers run client-side, so 3s is enough)
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-surface-400 animate-pulse">Chargement des stations...</p>
    </div>
  )

  const activeSessions = sessions.filter(s => s.status !== 'ended')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Caisse</h2>
          <p className="text-surface-500 text-xs mt-0.5">
            {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''} active{activeSessions.length !== 1 ? 's' : ''}
            {lastRefresh && ` · sync ${lastRefresh}`}
          </p>
        </div>
        <button onClick={refresh}
          className="text-sm text-surface-400 hover:text-white px-3 py-1.5 rounded-lg border border-surface-700 hover:border-surface-500 transition-colors">
          ↻ Actualiser
        </button>
      </div>
      <StationGrid stations={stations} sessions={sessions} onRefresh={refresh} />
    </div>
  )
}
