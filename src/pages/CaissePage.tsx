import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Session, Station } from '../types'
import StationGrid from '../components/station/StationGrid'
import { Button } from '@/components/ui/button'

export default function CaissePage() {
  const [stations, setStations]       = useState<Station[]>([])
  const [sessions, setSessions]       = useState<Session[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [lastRefresh, setLastRefresh] = useState('')

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [s, sess] = await Promise.all([
        window.playdesk.stations.list(),
        window.playdesk.sessions.active(),
      ])
      setStations(s)
      setSessions(sess)
      setLastRefresh(new Date().toLocaleTimeString('fr-MA'))
    } catch (e) { console.error(e) }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    refresh(true)
    const interval = setInterval(() => refresh(true), 3000)
    return () => clearInterval(interval)
  }, [refresh])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs tracking-widest uppercase">Chargement...</p>
      </div>
    </div>
  )

  const activeSessions = sessions.filter(s => s.status === 'active')
  const pausedSessions = sessions.filter(s => s.status === 'paused')
  const freeStations   = stations.filter(st => !sessions.find(s => s.station_id === st.id && s.status !== 'ended'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 flex flex-col gap-5 h-full overflow-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-2xl font-bold text-foreground tracking-widest uppercase">Caisse</h2>
          {lastRefresh && (
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest">Sync {lastRefresh}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()} disabled={refreshing} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Actives',  value: activeSessions.length, valueClass: 'text-green-400' },
          { label: 'En pause', value: pausedSessions.length, valueClass: 'text-yellow-400' },
          { label: 'Libres',   value: freeStations.length,   valueClass: 'text-foreground' },
        ].map(({ label, value, valueClass }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold font-mono tabular-nums ${valueClass}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      <StationGrid stations={stations} sessions={sessions} onRefresh={refresh} />
    </motion.div>
  )
}