import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, List, Zap } from 'lucide-react'
import { Station, Session } from '../../types'
import StationCard from './StationCard'
import StationBadge from './StationBadge'
import { formatTime, formatMAD } from '../../lib/utils'
import { calcSessionAmount, getTempsProgress } from '../../lib/pricing'

interface Props {
  stations:       Station[]
  sessions:       Session[]
  hasActiveShift: boolean   // ← passed down to StationCard
  onRefresh:      () => void
}

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, scale: 0.97, y: 6 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
}

type ViewMode = 'grid' | 'list'

function computeElapsed(session: Session): number {
  const startUnix = session.started_at_unix
    ? session.started_at_unix
    : Math.floor(new Date(session.started_at).getTime() / 1000)
  const nowUnix = Math.floor(Date.now() / 1000)
  if (session.status === 'paused') {
    const pausedAtUnix = session.paused_at_unix ?? nowUnix
    return Math.max(0, pausedAtUnix - startUnix - (session.paused_duration ?? 0))
  }
  return Math.max(0, nowUnix - startUnix - (session.paused_duration ?? 0))
}

// ── Per-row live timer — owns its own interval so it's always 1s accurate ────
function ListRow({
  station,
  session,
}: {
  station: Station
  session: Session | undefined
}) {
  const [elapsed, setElapsed] = useState(() => session ? computeElapsed(session) : 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (!session || session.status === 'paused') {
      setElapsed(session ? computeElapsed(session) : 0)
      return
    }

    const tick = () => setElapsed(computeElapsed(session))
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session?.id, session?.status, session?.paused_duration])

  const amount    = session ? calcSessionAmount(session, elapsed) : 0
  const tempsInfo = session?.type === 'temps' ? getTempsProgress(session, elapsed) : null

  const isExpired = tempsInfo?.isExpired ?? false
  const isWarning = tempsInfo?.isWarning ?? false

  const statusVal: 'libre' | 'active' | 'pause' | 'expired' = !session
    ? 'libre'
    : session.status === 'paused'
    ? 'pause'
    : isExpired ? 'expired' : 'active'

  const timerDisplay = session?.type === 'temps' && tempsInfo
    ? formatTime(tempsInfo.remaining)
    : formatTime(elapsed)

  const timerClass = isExpired
    ? 'text-red-500'
    : isWarning
    ? 'text-amber-500'
    : 'text-foreground'

  const typeLabel = session
    ? session.type === 'match' ? `Match ${session.match_duration}min`
    : session.type === 'temps' ? `Temps ${session.prepaid_minutes}min`
    : 'Libre'
    : '—'

  return (
    <motion.div
      variants={item}
      className={`grid grid-cols-12 gap-3 px-4 py-3 rounded-xl border bg-card items-center transition-colors hover:bg-muted/40 ${
        isExpired ? 'border-red-500/30 animate-pulse' : isWarning ? 'border-amber-400/30' : 'border-border'
      }`}
    >
      <div className="col-span-3 font-semibold text-sm text-foreground">{station.name}</div>
      <div className="col-span-2">
        <StationBadge status={statusVal} />
      </div>
      <div className="col-span-2 text-xs text-muted-foreground">{typeLabel}</div>
      <div className={`col-span-2 font-mono text-sm font-bold tabular-nums ${session ? timerClass : 'text-muted-foreground/30'}`}>
        {session ? timerDisplay : '—'}
      </div>
      <div className={`col-span-2 text-right font-mono text-sm font-bold ${session ? 'text-foreground' : 'text-muted-foreground/30'}`}>
        {session ? formatMAD(amount) : '—'}
      </div>
      <div className="col-span-1 flex justify-end">
        {session?.type === 'temps' && session.prepaid_minutes && (
          <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isExpired ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${Math.max(0, 100 - (elapsed / (session.prepaid_minutes * 60)) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main grid ─────────────────────────────────────────────────────────────────
export default function StationGrid({ stations, sessions, hasActiveShift, onRefresh }: Props) {
  const [viewMode, setViewMode]     = useState<ViewMode>('grid')
  const [activeOnly, setActiveOnly] = useState(false)

  const getSession = (stationId: number) =>
    sessions.find(s => s.station_id === stationId && s.status !== 'ended')

  const displayed = activeOnly
    ? stations.filter(st => !!getSession(st.id))
    : stations

  if (stations.length === 0) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      Aucune station configurée
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 justify-between">
        <button
          onClick={() => setActiveOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activeOnly
              ? 'bg-green-500/10 border-green-500/30 text-green-500 dark:text-green-400'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-3 h-3" />
          Actives seulement
          {activeOnly && (
            <span className="ml-1 bg-green-500/20 text-green-500 dark:text-green-400 rounded-full px-1.5 py-0.5 text-[10px]">
              {displayed.length}
            </span>
          )}
        </button>

        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
          {([['grid', LayoutGrid], ['list', List]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 && activeOnly && (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          Aucune station active en ce moment
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && displayed.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {displayed.map(station => (
            <motion.div key={station.id} variants={item}>
              <StationCard
                station={station}
                session={getSession(station.id)}
                stations={stations}
                sessions={sessions}
                hasActiveShift={hasActiveShift}
                onRefresh={onRefresh}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && displayed.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
            <div className="col-span-3">Station</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Chrono</div>
            <div className="col-span-2 text-right">Montant</div>
            <div className="col-span-1" />
          </div>

          {displayed.map(station => (
            <ListRow
              key={station.id}
              station={station}
              session={getSession(station.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}