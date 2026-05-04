import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Session } from '../../types'
import { formatTime, formatMAD } from '../../lib/utils'
import { X, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { useUndoStore } from '../../store/undoStore'

interface Props {
  session: Session
  elapsed: number
  amount:  number
  onClose: () => void
  onEnded: () => void
}

const TYPE_LABELS: Record<string, string> = {
  match: 'Match',
  temps: 'Temps prépayé',
  libre: 'Jeu Libre',
}

export default function EndSessionModal({ session, elapsed, amount, onClose, onEnded }: Props) {
  const [note, setNote]                     = useState('')
  const [loading, setLoading]               = useState(false)
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null)
  const pushUndo = useUndoStore(s => s.push)

  const handleConfirm = async () => {
    setLoading(true)
    const res = await window.playdesk.sessions.end(session.id, note || undefined)
    if (res.success) {
      setConfirmedTotal(res.total ?? null)
      onEnded()
      onClose()

      const stationName = session.station_name ?? `Station ${session.station_id}`
      const total       = res.total ?? amount
      pushUndo({
        label:       `Session terminée · ${stationName}`,
        description: `${formatMAD(total)} · ${TYPE_LABELS[session.type]}`,
        timeoutMs:   8000,
        onUndo: async () => {
          const undoRes = await window.playdesk.sessions.undoEnd(session.id)
          if (undoRes.success) onEnded()
          else console.warn('Undo failed:', undoRes.error)
        },
      })
    }
    setLoading(false)
  }

  const displayAmount = confirmedTotal ?? amount

  const rows = [
    { label: 'Type',          value: TYPE_LABELS[session.type] },
    { label: 'Durée active',  value: formatTime(elapsed), mono: true },
    ...(session.type === 'match' ? [
      { label: 'Matchs joués', value: String(session.match_count) },
      { label: 'Durée/match',  value: session.match_duration === 8 ? '8+ min' : `${session.match_duration} min` },
    ] : []),
    ...(session.type === 'temps' ? [
      { label: 'Durée prépayée', value: `${session.prepaid_minutes} min` },
    ] : []),
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-xl w-[400px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground uppercase tracking-widest">
                Terminer la session
              </h3>
              <p className="text-[10px] text-muted-foreground tracking-widest mt-0.5">
                {session.station_name ?? `Station ${session.station_id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Detail rows */}
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              {rows.map(({ label, value, mono }, i) => (
                <motion.div
                  key={i}
                  className="flex justify-between items-center px-4 py-2.5 border-b border-border last:border-0"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.15 }}
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs text-foreground font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
                </motion.div>
              ))}

              {/* Total */}
              <motion.div
                className="flex justify-between items-center px-4 py-3 bg-card border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rows.length * 0.04, duration: 0.2 }}
              >
                <span className="text-sm font-semibold text-foreground">Total à encaisser</span>
                <span className="text-primary font-bold text-2xl font-mono">{formatMAD(displayAmount)}</span>
              </motion.div>
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note optionnelle (incident, remise...)"
              className="w-full bg-muted border border-border focus:border-primary rounded-lg px-3 py-2.5 text-foreground text-sm outline-none resize-none transition-colors placeholder:text-muted-foreground"
              rows={2}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {loading ? 'Enregistrement...' : `Encaisser ${formatMAD(displayAmount)}`}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}