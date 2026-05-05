import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, AlertTriangle } from 'lucide-react'
import { Session, Station } from '../../types'
import { Button } from '../ui/button'

interface Props {
  session:   Session
  stations:  Station[]
  sessions:  Session[]   // all active sessions (to show occupancy)
  onClose:   () => void
  onTransferred: () => void
}

export default function TransferSessionModal({ session, stations, sessions, onClose, onTransferred }: Props) {
  const [targetId, setTargetId] = useState<number | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Exclude current station; only active stations
  const available = stations.filter(st => st.active && st.id !== session.station_id)

  const getOccupied = (stationId: number) =>
    sessions.find(s => s.station_id === stationId && s.status !== 'ended')

  const handleConfirm = async () => {
    if (!targetId) return
    setLoading(true)
    const res = await window.playdesk.sessions.transfer(session.id, targetId)
    if (res.success) {
      onTransferred()
      onClose()
    } else {
      setError(res.error ?? 'Erreur lors du transfert')
    }
    setLoading(false)
  }

  const targetStation = available.find(s => s.id === targetId)
  const targetOccupied = targetId ? getOccupied(targetId) : null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-xl w-[400px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground uppercase tracking-widest">Transférer</h3>
              <p className="text-[10px] text-muted-foreground tracking-widest mt-0.5">
                Session de {session.station_name}
              </p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Route preview */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="px-3 py-1.5 bg-muted rounded-lg text-sm font-semibold text-foreground">
                {session.station_name}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                targetStation
                  ? 'bg-primary/10 border border-primary/30 text-foreground'
                  : 'bg-muted text-muted-foreground border border-dashed border-border'
              }`}>
                {targetStation ? targetStation.name : '?'}
              </div>
            </div>

            {/* Station selector */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
              {available.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Aucune autre station disponible</p>
              )}
              {available.map(st => {
                const occupied = getOccupied(st.id)
                const isSelected = targetId === st.id
                return (
                  <button
                    key={st.id}
                    onClick={() => { setTargetId(st.id); setError('') }}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    <span className="font-medium text-sm">{st.name}</span>
                    {occupied ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 border border-amber-400/20">
                        Occupée — sera terminée
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        Libre
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Warning if target is occupied */}
            <AnimatePresence>
              {targetOccupied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-400/8 border border-amber-400/20"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    La session en cours sur {targetStation?.name} sera automatiquement clôturée et enregistrée.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || !targetId}
                className="flex-1"
              >
                {loading ? 'Transfert...' : 'Confirmer le transfert'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}