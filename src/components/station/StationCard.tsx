import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Plus } from 'lucide-react'
import { Station, Session } from '../../types'
import StationBadge from './StationBadge'
import { formatTime, formatMAD } from '../../lib/utils'
import { calcSessionAmount, getTempsProgress } from '../../lib/pricing'
import StartSessionModal from '../session/StartSessionModal'
import EndSessionModal from '../session/EndSessionModal'
import { useAuthStore } from '../../store/authStore'
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

// Inline-style action button — adapts to theme
function ActionButton({
  onClick,
  disabled,
  children,
  variant = 'default',
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'default' | 'amber' | 'red' | 'green'
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { color: 'var(--muted-foreground)', border: '1px solid var(--border)', background: 'transparent' },
    amber:   { color: '#fbbf24',                  border: '1px solid rgba(251,191,36,0.2)', background: 'transparent' },
    red:     { color: '#f87171',                  border: '1px solid rgba(239,68,68,0.2)',  background: 'transparent' },
    green:   { color: '#4ade80',                  border: '1px solid rgba(74,222,128,0.2)', background: 'transparent' },
  }
  const hoverStyles: Record<string, Partial<React.CSSProperties>> = {
    default: { color: 'var(--foreground)',  background: 'var(--muted)' },
    amber:   { color: '#fde68a',            background: 'rgba(251,191,36,0.08)' },
    red:     { color: '#fca5a5',            background: 'rgba(239,68,68,0.08)' },
    green:   { color: '#86efac',            background: 'rgba(74,222,128,0.08)' },
  }

  const base = styles[variant]
  const hover = hoverStyles[variant]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
      style={base}
      onMouseEnter={e => Object.assign(e.currentTarget.style, hover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, base)}
    >
      {children}
    </button>
  )
}

export default function StationCard({ station, session, onRefresh }: Props) {
  const { user } = useAuthStore()
  const [elapsed, setElapsed]     = useState(() => session ? computeElapsed(session) : 0)
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd]     = useState(false)
  const [loading, setLoading]     = useState(false)

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
        const total     = session.prepaid_minutes * 60
        const remaining = total - e
        if (remaining <= 0 && !expiredRef.current)       { expiredRef.current = true; beepEnd(); onRefresh() }
        else if (remaining <= 300 && !warnedRef.current) { warnedRef.current = true; beepWarning() }
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

  const handlePause    = async () => { setLoading(true); await window.playdesk.sessions.pause(session!.id);    await onRefresh(); setLoading(false) }
  const handleResume   = async () => { setLoading(true); await window.playdesk.sessions.resume(session!.id);   await onRefresh(); setLoading(false) }
  const handleAddMatch = async () => { setLoading(true); await window.playdesk.sessions.addMatch(session!.id); await onRefresh(); setLoading(false) }

  const sessionTypeLabel = session
    ? session.type === 'match' ? `Match · ${session.match_duration} min`
    : session.type === 'temps' ? `Temps · ${session.prepaid_minutes} min`
    : 'Jeu Libre'
    : null

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className={`glow-card relative flex flex-col overflow-hidden ${glowByStatus[status]}`}
      >
        {/* PS5 image block — clickable when libre to start session */}
        <div
          className="relative flex items-center justify-center overflow-hidden py-16"
          onClick={!session ? () => setShowStart(true) : undefined}
          style={{
            height:       250,
            background:   'var(--background)',
            borderBottom: '1px solid var(--border)',
            cursor:       !session ? 'pointer' : 'default',
          }}
        >
          <img
            src={ps5Img}
            alt={station.name}
            style={{
              height:     '250px',
              width:      'auto',
              objectFit:  'contain',
              filter:     status === 'libre'
                ? 'brightness(0.65) saturate(0)'
                : status === 'pause'
                  ? 'brightness(0.45) saturate(0.4)'
                  : 'brightness(1)',
              transition: 'filter 0.3s ease',
            }}
          />


          {/* Ghost number watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              style={{
                fontSize:      '72px',
                fontWeight:    900,
                fontFamily:    'monospace',
                color:         'rgba(255,255,255,0.05)',
                letterSpacing: '-4px',
                userSelect:    'none',
                lineHeight:    1,
              }}
            >
              {station.name.match(/\d+(?!.*\d)/)?.[0] ?? '?'}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3.5 flex-1">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span
                className="font-semibold text-sm tracking-wide"
                style={{ color: 'var(--foreground)' }}
              >
                {station.name}
              </span>
              {sessionTypeLabel && (
                <p
                  className="text-[10px] uppercase tracking-widest mt-0.5"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {sessionTypeLabel}
                </p>
              )}
            </div>
            <StationBadge status={status} />
          </div>

          {session ? (
            <>
              {/* Timer block */}
              <div
                className="rounded-lg px-3 py-3.5 text-center"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                }}
              >
                {session.type === 'temps' && tempsInfo ? (
                  <>
                    <p
                      className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-2"
                      style={{
                        color: tempsInfo.isExpired ? '#ef4444'
                          : tempsInfo.isWarning ? '#f59e0b'
                          : 'var(--muted-foreground)',
                      }}
                    >
                      {tempsInfo.isExpired ? 'TEMPS ÉCOULÉ' : tempsInfo.isWarning ? '< 5 MIN' : 'Restant'}
                    </p>
                    <p
                      className="text-3xl font-mono font-bold tracking-tight tabular-nums"
                      style={{
                        color: tempsInfo.isExpired ? '#ef4444'
                          : tempsInfo.isWarning ? '#f59e0b'
                          : 'var(--foreground)',
                      }}
                    >
                      {formatTime(tempsInfo.remaining)}
                    </p>
                    <div className="progress-track mt-3">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(0, 100 - (elapsed / ((session.prepaid_minutes ?? 60) * 60)) * 100)}%`,
                          background: tempsInfo.isExpired ? '#ef4444'
                            : tempsInfo.isWarning ? '#f59e0b'
                            : '#4ade80',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      className="text-[9px] uppercase tracking-[0.2em] mb-2"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {session.status === 'paused' ? 'En pause' : 'Durée'}
                    </p>
                    <p
                      className="text-3xl font-mono font-bold tracking-tight tabular-nums"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {formatTime(elapsed)}
                    </p>
                    {session.type === 'match' && (
                      <p
                        className="text-[10px] mt-1.5"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {session.match_count} match{session.match_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Amount row */}
              <div className="flex items-center justify-between px-0.5">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Total estimé
                </span>
                <span
                  className="font-bold text-base font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  {formatMAD(amount)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                {session.status === 'active' && (
                  <>
                    {session.type === 'match' && (
                      <ActionButton onClick={handleAddMatch} disabled={loading}>
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter un match
                      </ActionButton>
                    )}
                    <div className="flex gap-1.5">
                      <ActionButton onClick={handlePause} disabled={loading} variant="amber">
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </ActionButton>
                      <ActionButton onClick={() => setShowEnd(true)} disabled={loading} variant="red">
                        <Square className="w-3.5 h-3.5" />
                        Terminer
                      </ActionButton>
                    </div>
                  </>
                )}

                {session.status === 'paused' && (
                  <div className="flex gap-1.5">
                    <ActionButton onClick={handleResume} disabled={loading} variant="green">
                      <Play className="w-3.5 h-3.5" />
                      Reprendre
                    </ActionButton>
                    <ActionButton onClick={() => setShowEnd(true)} disabled={loading} variant="red">
                      <Square className="w-3.5 h-3.5" />
                      Terminer
                    </ActionButton>
                  </div>
                )}

                {status === 'expired' && (
                  <ActionButton onClick={() => setShowEnd(true)} disabled={loading} variant="red">
                    Clôturer la session
                  </ActionButton>
                )}
              </div>
            </>
          ) : (
            /* Empty state — just a small hint, image above is the click target */
            <div className="flex-1 flex items-center justify-center">
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
              >
                Cliquer pour démarrer
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {showStart && (
        <StartSessionModal
          station={station}
          managerId={user!.id}
          onClose={() => setShowStart(false)}
          onStarted={onRefresh}
        />
      )}
      {showEnd && session && (
        <EndSessionModal
          session={session}
          elapsed={elapsed}
          amount={amount}
          onClose={() => setShowEnd(false)}
          onEnded={onRefresh}
        />
      )}
    </>
  )
}