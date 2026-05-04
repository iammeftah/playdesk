import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Plus } from 'lucide-react'
import { Station, Session } from '../../types'
import StationBadge from './StationBadge'
import { formatTime, formatMAD } from '../../lib/utils'
import { calcSessionAmount, getTempsProgress } from '../../lib/pricing'
import StartSessionModal from '../session/StartSessionModal'
import EndSessionModal   from '../session/EndSessionModal'
import { useAuthStore }  from '../../store/authStore'
import { useUndoStore }  from '../../store/undoStore'
import { beepWarning, beepEnd, beepLong } from '../../lib/audio'
import ps5Img from '../../assets/ps5.png'

interface Props { station: Station; session?: Session; onRefresh: () => void }

type StationStatus = 'libre' | 'active' | 'pause' | 'expired'

function getStationStatus(session?: Session, elapsedSeconds?: number): StationStatus {
  if (!session) return 'libre'
  if (session.status === 'paused') return 'pause'
  if (session.type === 'temps' && session.prepaid_minutes && elapsedSeconds !== undefined) {
    if (elapsedSeconds >= session.prepaid_minutes * 60) return 'expired'
  }
  return 'active'
}

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

const LONG_SESSION_THRESHOLD = 3 * 60 * 60

const glowByStatus: Record<StationStatus, string> = {
  libre:   '',
  active:  'glow-active',
  pause:   'glow-pause',
  expired: 'glow-expired',
}

// ── Hover button — theme-aware, no hardcoded rgba ────────────────────────────
function HoverBtn({
  onClick, disabled, children, color, delay = 0, flex = false,
}: {
  onClick:   () => void
  disabled?: boolean
  children:  React.ReactNode
  color:     'default' | 'amber' | 'red' | 'green'
  delay?:    number
  flex?:     boolean
}) {
  const colorClass: Record<string, string> = {
    default: 'border-border/60 text-foreground bg-background/70 hover:bg-muted/80',
    amber:   'border-amber-400/40 text-amber-500 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-400/10 hover:bg-amber-100/80 dark:hover:bg-amber-400/15',
    red:     'border-red-400/40   text-red-500   dark:text-red-400   bg-red-50/80   dark:bg-red-400/10   hover:bg-red-100/80   dark:hover:bg-red-400/15',
    green:   'border-green-500/40 text-green-600 dark:text-green-400 bg-green-50/80 dark:bg-green-400/10 hover:bg-green-100/80 dark:hover:bg-green-400/15',
  }
  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ delay, duration: 0.15 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border backdrop-blur-sm transition-colors disabled:opacity-40 cursor-pointer ${flex ? 'flex-1' : 'w-full'} ${colorClass[color]}`}
    >
      {children}
    </motion.button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StationCard({ station, session, onRefresh }: Props) {
  const { user }   = useAuthStore()
  const pushUndo   = useUndoStore(s => s.push)

  const [elapsed, setElapsed]     = useState(() => session ? computeElapsed(session) : 0)
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [hovered, setHovered]     = useState(false)

  const warnedRef      = useRef(false)
  const expiredRef     = useRef(false)
  const longSessionRef = useRef(false)

  const status    = getStationStatus(session, elapsed)
  const amount    = session ? calcSessionAmount(session, elapsed) : 0
  const tempsInfo = session?.type === 'temps' ? getTempsProgress(session, elapsed) : null

  useEffect(() => {
    if (!session || session.status === 'paused') {
      setElapsed(session ? computeElapsed(session) : 0)
      return
    }
    const tick = () => {
      const e = computeElapsed(session)
      setElapsed(e)
      if (session.type === 'temps' && session.prepaid_minutes) {
        const remaining = session.prepaid_minutes * 60 - e
        if (remaining <= 0 && !expiredRef.current)       { expiredRef.current = true;  beepEnd();     onRefresh() }
        else if (remaining <= 300 && !warnedRef.current) { warnedRef.current  = true;  beepWarning()             }
      }
      if (e >= LONG_SESSION_THRESHOLD && !longSessionRef.current) { longSessionRef.current = true; beepLong() }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.id, session?.status, session?.paused_duration])

  useEffect(() => {
    warnedRef.current = false
    expiredRef.current = false
    longSessionRef.current = false
  }, [session?.id])

  const handlePause  = async () => { setLoading(true); await window.playdesk.sessions.pause(session!.id);  await onRefresh(); setLoading(false) }
  const handleResume = async () => { setLoading(true); await window.playdesk.sessions.resume(session!.id); await onRefresh(); setLoading(false) }

  const handleAddMatch = async () => {
    if (!session) return
    const previousCount = session.match_count ?? 0
    setLoading(true)
    const res = await window.playdesk.sessions.addMatch(session.id)
    await onRefresh()
    setLoading(false)
    if (res.success) {
      pushUndo({
        label:       `Match ajouté · ${station.name}`,
        description: `Match #${res.matchCount} → annuler`,
        timeoutMs:   10000,
        onUndo: async () => {
          const undoRes = await window.playdesk.sessions.undoAddMatch(session.id, previousCount)
          if (undoRes.success) await onRefresh()
          else console.warn('Undo addMatch failed:', undoRes.error)
        },
      })
    }
  }

  // Timer display
  const timerValue = session?.type === 'temps' && tempsInfo
    ? formatTime(tempsInfo.remaining)
    : formatTime(elapsed)

  // Use Tailwind class names for timer color instead of inline style
  const timerClass = tempsInfo?.isExpired
    ? 'text-red-500 dark:text-red-400'
    : tempsInfo?.isWarning
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-foreground'

  // Progress bar color class
  const progressClass = tempsInfo?.isExpired
    ? 'bg-red-500 dark:bg-red-400'
    : tempsInfo?.isWarning
    ? 'bg-amber-500 dark:bg-amber-400'
    : 'bg-green-500 dark:bg-green-400'

  const progressWidth = session?.prepaid_minutes
    ? Math.max(0, 100 - (elapsed / (session.prepaid_minutes * 60)) * 100)
    : 0

  const sessionTypeLabel = session
    ? session.type === 'match' ? `Match · ${session.match_duration} min`
    : session.type === 'temps' ? `Temps · ${session.prepaid_minutes} min`
    : 'Jeu Libre'
    : null

  // Controller filter — in dark mode libre/pause images need brightness boost, not cut
  // light mode: dim slightly for libre/pause; active = full
  const controllerFilter = (() => {
    if (hovered && session)  return 'brightness(0.35) blur(4px) saturate(0.2)'
    if (status === 'libre')  return 'brightness(0.65) saturate(0)'
    if (status === 'pause')  return 'brightness(0.55) saturate(0.4)'
    return 'brightness(1) saturate(1)'
  })()

  // Image area bg — subtle contrast from card in both modes
  const imgAreaClass = 'bg-muted/40 dark:bg-muted/20'

  return (
    <>
      <motion.div
        className={`glow-card relative flex flex-col overflow-hidden rounded-xl border border-border bg-card ${glowByStatus[status]}`}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* ── Controller image area (fixed height) ── */}
        <div
          className={`relative flex items-center justify-center overflow-hidden h-52 ${imgAreaClass} ${!session ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={!session ? () => setShowStart(true) : undefined}
        >
          {/* Controller image */}
          <motion.img
            src={ps5Img}
            alt={station.name}
            className="h-72 w-auto object-contain select-none"
            animate={{ filter: controllerFilter }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />

          {/* Ghost station number — visible in both modes */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[80px] font-black font-mono text-foreground/[0.04] leading-none tracking-[-4px]">
              {station.name.match(/\d+(?!.*\d)/)?.[0] ?? '?'}
            </span>
          </div>

          {/* ── Hover action overlay (session active) ── */}
          <AnimatePresence>
            {hovered && session && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {session.status === 'active' && (
                  <>
                    {session.type === 'match' && (
                      <HoverBtn onClick={handleAddMatch} disabled={loading} color="default" delay={0}>
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter un match
                      </HoverBtn>
                    )}
                    <div className="flex gap-2 w-full">
                      <HoverBtn onClick={handlePause} disabled={loading} color="amber" delay={0.03} flex>
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </HoverBtn>
                      <HoverBtn onClick={() => setShowEnd(true)} disabled={loading} color="red" delay={0.06} flex>
                        <Square className="w-3.5 h-3.5" />
                        Terminer
                      </HoverBtn>
                    </div>
                  </>
                )}

                {session.status === 'paused' && (
                  <div className="flex gap-2 w-full">
                    <HoverBtn onClick={handleResume} disabled={loading} color="green" delay={0} flex>
                      <Play className="w-3.5 h-3.5" />
                      Reprendre
                    </HoverBtn>
                    <HoverBtn onClick={() => setShowEnd(true)} disabled={loading} color="red" delay={0.03} flex>
                      <Square className="w-3.5 h-3.5" />
                      Terminer
                    </HoverBtn>
                  </div>
                )}

                {status === 'expired' && (
                  <HoverBtn onClick={() => setShowEnd(true)} disabled={loading} color="red" delay={0}>
                    Clôturer la session
                  </HoverBtn>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Empty hover hint ── */}
          <AnimatePresence>
            {!session && hovered && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Cliquer pour démarrer
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom info strip ── */}
        <div className="shrink-0 border-t border-border px-3.5 pt-2.5 pb-3 bg-card flex flex-col gap-2 min-h-24">

          {/* Name + badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-foreground tracking-wide leading-none">
                {station.name}
              </span>
              {sessionTypeLabel && (
                <p className="text-[9px] uppercase tracking-widest mt-0.5 text-muted-foreground leading-none">
                  {sessionTypeLabel}
                </p>
              )}
            </div>
            <StationBadge status={status} />
          </div>

          {/* Timer + amount */}
          <div className="flex items-center justify-between min-h-7">
            <AnimatePresence mode="wait">
              {session ? (
                <motion.div
                  key="timer"
                  className="flex items-baseline gap-1.5"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-mono font-bold text-xl tabular-nums tracking-tight leading-none ${timerClass}`}>
                    {timerValue}
                  </span>
                  {session.type === 'match' && (
                    <span className="text-[10px] text-muted-foreground">
                      · {session.match_count} match{session.match_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  {session.status === 'paused' && (
                    <span className="text-[9px] text-amber-500 dark:text-amber-400 uppercase tracking-wide font-semibold">pause</span>
                  )}
                </motion.div>
              ) : (
                <motion.span
                  key="empty"
                  className="text-sm text-muted-foreground/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  —
                </motion.span>
              )}
            </AnimatePresence>

            {session && (
              <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                {formatMAD(amount)}
              </span>
            )}
          </div>

          {/* Temps progress bar */}
          {session?.type === 'temps' && session.prepaid_minutes && (
            <div className="h-[3px] rounded-full bg-border overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressClass}`}
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showStart && (
          <StartSessionModal
            key="start-modal"
            station={station}
            managerId={user!.id}
            onClose={() => setShowStart(false)}
            onStarted={onRefresh}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnd && session && (
          <EndSessionModal
            key="end-modal"
            session={session}
            elapsed={elapsed}
            amount={amount}
            onClose={() => setShowEnd(false)}
            onEnded={onRefresh}
          />
        )}
      </AnimatePresence>
    </>
  )
}