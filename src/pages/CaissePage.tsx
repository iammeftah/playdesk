import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Session, Station } from '../types'
import StationGrid from '../components/station/StationGrid'
import { Button } from '@/components/ui/button'

interface StatCardProps {
  label: string
  value: number
  variant: 'green' | 'amber' | 'neutral'
  delay: number
}

function StatCard({ label, value, variant, delay }: StatCardProps) {
  const variantClass: Record<string, {
    card: string
    value: string
    bar: string
  }> = {
    green: {
      card:  'bg-green-50/60 dark:bg-green-500/5 border-green-200/60 dark:border-green-500/15',
      value: 'text-green-600 dark:text-green-400',
      bar:   'bg-green-500 dark:bg-green-400',
    },
    amber: {
      card:  'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200/60 dark:border-amber-500/15',
      value: 'text-amber-600 dark:text-amber-400',
      bar:   'bg-amber-500 dark:bg-amber-400',
    },
    neutral: {
      card:  'bg-card border-border',
      value: 'text-foreground',
      bar:   'bg-border',
    },
  }

  const c = variantClass[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border px-7 py-5 flex items-center justify-between ${c.card}`}
    >
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-5xl font-bold font-mono tabular-nums leading-none ${c.value}`}>{value}</p>
      </div>
      <div className={`w-[3px] h-9 rounded-full opacity-40 ${c.bar}`} />
    </motion.div>
  )
}

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
      {/* Header */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Actives"  value={activeSessions.length} variant="green"   delay={0}    />
        <StatCard label="En pause" value={pausedSessions.length} variant="amber"   delay={0.04} />
        <StatCard label="Libres"   value={freeStations.length}   variant="neutral" delay={0.08} />
      </div>

      <StationGrid stations={stations} sessions={sessions} onRefresh={refresh} />
    </motion.div>
  )
}