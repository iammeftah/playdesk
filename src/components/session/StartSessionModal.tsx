import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Station } from '../../types'
import { calcMatchPrice } from '../../lib/pricing'
import { X, Gamepad2, Clock, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  station: Station
  managerId: number
  onClose: () => void
  onStarted: () => void
}

const PRESET_DURATIONS = [
  { minutes: 30,  label: '30 min', price: 15 },
  { minutes: 60,  label: '1 h',    price: 30 },
  { minutes: 120, label: '2 h',    price: 60 },
]

const SESSION_TYPES = [
  { id: 'match', label: 'Match',  Icon: Gamepad2 },
  { id: 'temps', label: 'Temps',  Icon: Clock },
  { id: 'libre', label: 'Libre',  Icon: Infinity },
] as const

export default function StartSessionModal({ station, managerId, onClose, onStarted }: Props) {
  const [type, setType]                     = useState<'match' | 'temps' | 'libre'>('match')
  const [matchDuration, setMatchDuration]   = useState(8)
  const [prepaidMinutes, setPrepaidMinutes] = useState(60)
  const [customMinutes, setCustomMinutes]   = useState('')
  const [useCustom, setUseCustom]           = useState(false)
  const [loading, setLoading]               = useState(false)

  const effectivePrepaidMinutes = useCustom ? parseInt(customMinutes) || 60 : prepaidMinutes
  const customPrice = useCustom ? ((parseInt(customMinutes) || 0) / 60 * 30).toFixed(2) : null

  const handleStart = async () => {
    if (type === 'temps' && useCustom && (!customMinutes || parseInt(customMinutes) <= 0)) return
    setLoading(true)
    await window.playdesk.sessions.start({
      stationId: station.id,
      managerId,
      type,
      matchDuration:  type === 'match' ? matchDuration : undefined,
      prepaidMinutes: type === 'temps' ? effectivePrepaidMinutes : undefined,
    })
    onStarted()
    onClose()
    setLoading(false)
  }

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
          className="bg-card border border-border rounded-xl w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-sans text-base font-bold text-foreground uppercase tracking-widest">Démarrer</h3>
              <p className="text-[10px] text-muted-foreground tracking-widest mt-0.5">{station.name}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1.5 bg-background rounded-lg p-1">
              {SESSION_TYPES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold tracking-wide transition-all',
                    type === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Match options */}
            <AnimatePresence mode="wait">
              {type === 'match' && (
                <motion.div
                  key="match"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] mb-2.5">Durée par match</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([6, 7, 8] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setMatchDuration(d)}
                        className={cn(
                          'py-3 rounded-lg text-center border transition-all',
                          matchDuration === d
                            ? 'bg-primary/10 border-primary/40 text-foreground'
                            : 'bg-muted border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                        )}
                      >
                        <div className="font-sans font-bold text-sm tracking-wide">{d === 8 ? '8+ min' : `${d} min`}</div>
                        <div className="text-[10px] mt-0.5 opacity-70 font-mono">{calcMatchPrice(d)} MAD</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2.5 tracking-wide">
                    Total = matchs × {calcMatchPrice(matchDuration)} MAD
                  </p>
                </motion.div>
              )}

              {/* Temps options */}
              {type === 'temps' && (
                <motion.div
                  key="temps"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] mb-2.5">Durée prépayée</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {PRESET_DURATIONS.map(({ minutes, label, price }) => (
                      <button
                        key={minutes}
                        onClick={() => { setPrepaidMinutes(minutes); setUseCustom(false) }}
                        className={cn(
                          'py-3 rounded-lg text-center border transition-all',
                          !useCustom && prepaidMinutes === minutes
                            ? 'bg-primary/10 border-primary/40 text-foreground'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div className="font-sans font-bold text-sm">{label}</div>
                        <div className="text-[10px] mt-0.5 opacity-70 font-mono">{price} MAD</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setUseCustom(true)}
                    className={cn(
                      'w-full py-2 rounded-lg text-xs font-medium tracking-wide border transition-all',
                      useCustom
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Personnalisé
                  </button>
                  <AnimatePresence>
                    {useCustom && (
                      <motion.div
                        className="mt-2 flex items-center gap-2.5"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <input
                          type="number" min="1" max="480" value={customMinutes}
                          onChange={e => setCustomMinutes(e.target.value)}
                          placeholder="Minutes"
                          className="flex-1 bg-muted border border-border focus:border-primary rounded-lg px-3 py-2 text-foreground text-center font-mono text-sm outline-none transition-colors"
                          autoFocus
                        />
                        <span className="text-muted-foreground text-xs">min</span>
                        {customPrice && <span className="text-primary font-bold text-sm font-mono">{customPrice} MAD</span>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Libre info */}
              {type === 'libre' && (
                <motion.div
                  key="libre"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="bg-muted/50 border border-border rounded-lg p-4"
                >
                  <p className="text-foreground text-sm">Chronomètre ouvert — facturation à la minute.</p>
                  <p className="text-primary text-sm font-semibold font-mono mt-1.5">0.50 MAD / min · 30 MAD/h</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary */}
            <div className="bg-background border border-border rounded-lg px-4 py-2.5 text-[11px] text-muted-foreground tracking-wide">
              {type === 'match' && <span>Match · {matchDuration === 8 ? '8+ min' : `${matchDuration} min`} · {calcMatchPrice(matchDuration)} MAD/match</span>}
              {type === 'temps' && <span>Temps prépayé · {effectivePrepaidMinutes} min · {(effectivePrepaidMinutes / 60 * 30).toFixed(2)} MAD</span>}
              {type === 'libre' && <span>Jeu libre · facturation à la minute</span>}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
              <Button
                onClick={handleStart}
                disabled={loading || (type === 'temps' && useCustom && !customMinutes)}
                className="flex-1"
              >
                {loading ? 'Démarrage...' : 'Démarrer'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}