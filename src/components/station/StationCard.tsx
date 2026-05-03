import { useState, useEffect, useRef } from 'react'
import { Station, Session } from '../../types'
import StationBadge from './StationBadge'
import { formatTime, formatMAD } from '../../lib/utils'
import { calcSessionAmount, getTempsProgress } from '../../lib/pricing'
import StartSessionModal from '../session/StartSessionModal'
import EndSessionModal from '../session/EndSessionModal'
import { useAuthStore } from '../../store/authStore'
import { beepWarning, beepEnd, beepLong } from '../../lib/audio'

interface Props { station: Station; session?: Session; onRefresh: () => void }

function getStationStatus(session?: Session, elapsedSeconds?: number): 'libre' | 'active' | 'pause' | 'expired' {
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
    // When paused: time until pause started, minus all prior paused durations
    const pausedAtUnix = session.paused_at_unix
      ? session.paused_at_unix
      : nowUnix
    return Math.max(0, pausedAtUnix - startUnix - (session.paused_duration ?? 0))
  }

  return Math.max(0, nowUnix - startUnix - (session.paused_duration ?? 0))
}

const LONG_SESSION_THRESHOLD = 3 * 60 * 60 // 3 hours in seconds

export default function StationCard({ station, session, onRefresh }: Props) {
  const { user } = useAuthStore()
  const [elapsed, setElapsed] = useState(() => session ? computeElapsed(session) : 0)
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd] = useState(false)
  const [loading, setLoading] = useState(false)

  const warnedRef = useRef(false)
  const expiredRef = useRef(false)
  const longSessionRef = useRef(false)

  const status = getStationStatus(session, elapsed)

  // Tick every second, only for active sessions
  useEffect(() => {
    if (!session || session.status === 'paused') {
      setElapsed(session ? computeElapsed(session) : 0)
      return
    }

    const tick = () => {
      const e = computeElapsed(session)
      setElapsed(e)

      // Audio alerts for Temps sessions
      if (session.type === 'temps' && session.prepaid_minutes) {
        const total = session.prepaid_minutes * 60
        const remaining = total - e

        if (remaining <= 0 && !expiredRef.current) {
          expiredRef.current = true
          beepEnd()
          onRefresh() // force card status update
        } else if (remaining <= 300 && remaining > 0 && !warnedRef.current) {
          warnedRef.current = true
          beepWarning()
        }
      }

      // Long session alert (3h+) for any type
      if (e >= LONG_SESSION_THRESHOLD && !longSessionRef.current) {
        longSessionRef.current = true
        beepLong()
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.id, session?.status, session?.paused_duration])

  // Reset alert flags when session changes
  useEffect(() => {
    warnedRef.current = false
    expiredRef.current = false
    longSessionRef.current = false
  }, [session?.id])

  const amount = session ? calcSessionAmount(session, elapsed) : 0
  const tempsInfo = session?.type === 'temps' ? getTempsProgress(session, elapsed) : null

  const handlePause = async () => {
    setLoading(true)
    await window.playdesk.sessions.pause(session!.id)
    await onRefresh()
    setLoading(false)
  }

  const handleResume = async () => {
    setLoading(true)
    await window.playdesk.sessions.resume(session!.id)
    await onRefresh()
    setLoading(false)
  }

  const handleAddMatch = async () => {
    setLoading(true)
    await window.playdesk.sessions.addMatch(session!.id)
    await onRefresh()
    setLoading(false)
  }

  const borderColor = {
    libre:   'border-surface-800',
    active:  'border-green-700/60',
    pause:   'border-yellow-700/60',
    expired: 'border-red-600 animate-pulse',
  }[status]

  const sessionTypeLabel = session
    ? session.type === 'match' ? `Match · ${session.match_duration}min`
    : session.type === 'temps' ? `Temps · ${session.prepaid_minutes}min`
    : 'Jeu Libre'
    : null

  return (
    <>
      <div className={`bg-surface-900 border-2 ${borderColor} rounded-xl p-4 flex flex-col gap-3 transition-all duration-300`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-lg">{station.name}</span>
          <StationBadge status={status} />
        </div>

        {/* Session type label */}
        {sessionTypeLabel && (
          <div className="text-xs font-medium text-surface-400 tracking-wider uppercase">
            {sessionTypeLabel}
          </div>
        )}

        {/* Timer display */}
        {session ? (
          <>
            <div className="text-center py-1">
              {session.type === 'temps' && tempsInfo ? (
                <>
                  <p className={`text-xs font-medium mb-1 ${tempsInfo.isWarning ? 'text-yellow-400' : tempsInfo.isExpired ? 'text-red-400' : 'text-surface-400'}`}>
                    {tempsInfo.isExpired ? '⚠ TEMPS ÉCOULÉ' : tempsInfo.isWarning ? '⚠ Moins de 5 min' : 'Temps restant'}
                  </p>
                  <p className={`text-4xl font-mono font-bold ${tempsInfo.isExpired ? 'text-red-400' : tempsInfo.isWarning ? 'text-yellow-400' : 'text-white'}`}>
                    {formatTime(tempsInfo.remaining)}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${tempsInfo.isExpired ? 'bg-red-500' : tempsInfo.isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.max(0, 100 - (elapsed / ((session.prepaid_minutes ?? 60) * 60)) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">
                    {session.status === 'paused' ? '⏸ En pause' : 'Durée'}
                  </p>
                  <p className="text-4xl font-mono font-bold text-white">
                    {formatTime(elapsed)}
                  </p>
                </>
              )}

              {session.type === 'match' && (
                <p className="text-surface-400 text-sm mt-1">
                  {session.match_count} match{session.match_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="bg-surface-800 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-surface-500 mb-0.5">Total estimé</p>
              <p className="text-brand-400 font-bold text-xl">{formatMAD(amount)}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {session.status === 'active' && (
                <>
                  {session.type === 'match' && (
                    <button onClick={handleAddMatch} disabled={loading}
                      className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                      +1 Match
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handlePause} disabled={loading}
                      className="flex-1 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                      ⏸ Pause
                    </button>
                    <button onClick={() => setShowEnd(true)} disabled={loading}
                      className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                      ■ Terminer
                    </button>
                  </div>
                </>
              )}
              {session.status === 'paused' && (
                <div className="flex gap-2">
                  <button onClick={handleResume} disabled={loading}
                    className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                    ▶ Reprendre
                  </button>
                  <button onClick={() => setShowEnd(true)} disabled={loading}
                    className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                    ■ Terminer
                  </button>
                </div>
              )}
              {/* Expired temps — force end */}
              {status === 'expired' && (
                <button onClick={() => setShowEnd(true)} disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm animate-pulse transition-colors">
                  ⚠ Clôturer la session
                </button>
              )}
            </div>
          </>
        ) : (
          <button onClick={() => setShowStart(true)}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-8 rounded-lg transition-colors text-sm">
            ▶ Démarrer
          </button>
        )}
      </div>

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
