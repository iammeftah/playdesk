import { useState } from 'react'
import { Session } from '../../types'
import { formatTime, formatMAD } from '../../lib/utils'
import { X, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'

interface Props {
  session: Session
  elapsed: number
  amount: number
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

  const handleConfirm = async () => {
    setLoading(true)
    const res = await window.playdesk.sessions.end(session.id, note || undefined)
    if (res.success) {
      setConfirmedTotal(res.total ?? null)
      onEnded()
      onClose()
    }
    setLoading(false)
  }

  const displayAmount = confirmedTotal ?? amount

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-[400px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-sans text-base font-bold text-foreground uppercase tracking-widest">Terminer la session</h3>
            <p className="text-[10px] text-muted-foreground tracking-widest mt-0.5">{session.station_name ?? `Station ${session.station_id}`}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            {[
              { label: 'Type',         value: TYPE_LABELS[session.type] },
              { label: 'Durée active', value: formatTime(elapsed), mono: true },
              ...(session.type === 'match' ? [
                { label: 'Matchs joués', value: String(session.match_count) },
                { label: 'Durée/match',  value: session.match_duration === 8 ? '8+ min' : `${session.match_duration} min` },
              ] : []),
              ...(session.type === 'temps' ? [
                { label: 'Durée prépayée', value: `${session.prepaid_minutes} min` },
              ] : []),
            ].map(({ label, value, mono }, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs text-foreground font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}

            <div className="flex justify-between items-center px-4 py-3 bg-card border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total à encaisser</span>
              <span className="text-primary font-bold text-2xl font-mono">{formatMAD(displayAmount)}</span>
            </div>
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note optionnelle (incident, remise...)"
            className="w-full bg-muted border border-border focus:border-primary rounded-lg px-3 py-2.5 text-foreground text-sm outline-none resize-none transition-colors placeholder:text-muted-foreground"
            rows={2}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              {loading ? 'Enregistrement...' : `Encaisser ${formatMAD(displayAmount)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}