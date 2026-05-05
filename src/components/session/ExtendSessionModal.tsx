import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Plus } from 'lucide-react'
import { Session } from '../../types'
import { formatMAD } from '../../lib/utils'
import { Button } from '../ui/button'

interface Props {
  session: Session
  onClose: () => void
  onExtended: () => void
}

const PRESETS = [
  { minutes: 15, label: '+15 min', price: 7.5  },
  { minutes: 30, label: '+30 min', price: 15   },
  { minutes: 60, label: '+1h',     price: 30   },
]

export default function ExtendSessionModal({ session, onClose, onExtended }: Props) {
  const [selected, setSelected]   = useState<number>(30)
  const [custom, setCustom]       = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const effectiveMinutes = useCustom ? (parseInt(custom) || 0) : selected
  const price = (effectiveMinutes / 60) * 30

  const handleConfirm = async () => {
    if (effectiveMinutes <= 0) { setError('Durée invalide'); return }
    setLoading(true)
    const res = await window.playdesk.sessions.extend(session.id, effectiveMinutes)
    if (res.success) {
      onExtended()
      onClose()
    } else {
      setError(res.error ?? 'Erreur')
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border border-border rounded-xl w-[380px] shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground uppercase tracking-widest">Prolonger</h3>
              <p className="text-[10px] text-muted-foreground tracking-widest mt-0.5">
                {session.station_name} · actuellement {session.prepaid_minutes} min
              </p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.minutes}
                  onClick={() => { setSelected(p.minutes); setUseCustom(false) }}
                  className={`py-3 rounded-lg text-center border transition-all ${
                    !useCustom && selected === p.minutes
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="font-bold text-sm">{p.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70 font-mono">{p.price} MAD</div>
                </button>
              ))}
            </div>

            {/* Custom */}
            <button
              onClick={() => setUseCustom(true)}
              className={`w-full py-2 rounded-lg text-xs font-medium border transition-all ${
                useCustom
                  ? 'bg-primary/10 border-primary/40 text-foreground'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Durée personnalisée
            </button>

            <AnimatePresence>
              {useCustom && (
                <motion.div
                  className="flex items-center gap-2.5"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <input
                    type="number" min="1" max="480" value={custom}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="Minutes"
                    className="flex-1 bg-muted border border-border focus:border-primary rounded-lg px-3 py-2 text-foreground text-center font-mono text-sm outline-none"
                    autoFocus
                  />
                  <span className="text-muted-foreground text-xs">min</span>
                  {custom && <span className="text-primary font-bold text-sm font-mono">{((parseInt(custom)||0)/60*30).toFixed(2)} MAD</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            <div className="bg-background border border-border rounded-lg px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>+{effectiveMinutes} min</span>
              </div>
              <span className="font-bold font-mono text-lg text-primary">{formatMAD(price)}</span>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
              <Button onClick={handleConfirm} disabled={loading || effectiveMinutes <= 0} className="flex-1 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {loading ? 'Enregistrement...' : `Prolonger · ${formatMAD(price)}`}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}