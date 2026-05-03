import { useState } from 'react'
import { Session } from '../../types'
import { formatTime, formatMAD } from '../../lib/utils'

interface Props {
  session: Session
  elapsed: number
  amount: number
  onClose: () => void
  onEnded: () => void
}

export default function EndSessionModal({ session, elapsed, amount, onClose, onEnded }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    const res = await window.playdesk.sessions.end(session.id, note || undefined)
    if (res.success) {
      setConfirmedTotal(res.total)
      onEnded()
      onClose()
    }
    setLoading(false)
  }

  const displayAmount = confirmedTotal ?? amount

  const typeLabels = {
    match: 'Match',
    temps: 'Temps prépayé',
    libre: 'Jeu Libre',
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Terminer la session</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Summary */}
        <div className="bg-surface-800 rounded-xl p-4 mb-4 flex flex-col gap-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Station</span>
            <span className="text-white font-medium">{session.station_name ?? `Station ${session.station_id}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Type</span>
            <span className="text-white">{typeLabels[session.type]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Durée active</span>
            <span className="text-white font-mono">{formatTime(elapsed)}</span>
          </div>

          {session.type === 'match' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Matchs joués</span>
                <span className="text-white">{session.match_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Durée/match</span>
                <span className="text-white">{session.match_duration === 8 ? '8+ min' : `${session.match_duration} min`}</span>
              </div>
            </>
          )}

          {session.type === 'temps' && (
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Durée prépayée</span>
              <span className="text-white">{session.prepaid_minutes} min</span>
            </div>
          )}

          <div className="border-t border-surface-700 pt-3 mt-1 flex justify-between items-center">
            <span className="text-white font-semibold">Total à encaisser</span>
            <span className="text-brand-400 font-bold text-2xl">{formatMAD(displayAmount)}</span>
          </div>
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note optionnelle (incident, remise, info...)"
          className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500 resize-none mb-4"
          rows={2}
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-surface-800 text-surface-300 hover:text-white text-sm font-medium">
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm disabled:opacity-50 transition-colors">
            {loading ? 'Enregistrement...' : `✓ Encaisser ${formatMAD(displayAmount)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
