import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, X } from 'lucide-react'
import { useUndoStore, UndoAction } from '../../store/undoStore'

function UndoToastItem({ action }: { action: UndoAction }) {
  const remove = useUndoStore(s => s.remove)
  const [progress, setProgress] = useState(1)
  const [undoing, setUndoing]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef   = useRef<number | null>(null)

  useEffect(() => {
    const start    = Date.now()
    const duration = action.expiresAt - start

    const tick = () => {
      const p = Math.max(0, 1 - (Date.now() - start) / duration)
      setProgress(p)
      if (p > 0) rafRef.current = requestAnimationFrame(tick)
      else remove(action.id)
    }
    rafRef.current   = requestAnimationFrame(tick)
    timerRef.current = setTimeout(() => remove(action.id), duration)

    return () => {
      if (rafRef.current)  cancelAnimationFrame(rafRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleUndo = async () => {
    if (undoing) return
    if (timerRef.current)  clearTimeout(timerRef.current)
    if (rafRef.current)    cancelAnimationFrame(rafRef.current)
    setUndoing(true)
    try { await action.onUndo() } finally { remove(action.id) }
  }

  const handleDismiss = () => {
    if (timerRef.current)  clearTimeout(timerRef.current)
    if (rafRef.current)    cancelAnimationFrame(rafRef.current)
    remove(action.id)
  }

  // SVG ring — only inline because it's pure math, not styling
  const SIZE = 32, STROKE = 2.5
  const R    = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 12,  scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 min-w-72 max-w-sm px-3.5 py-2.5 rounded-xl bg-card border border-border shadow-2xl pointer-events-auto"
    >
      {/* Countdown ring */}
      <div className="relative shrink-0 w-8 h-8">
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-border" />
          <circle
            cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)}
            className={undoing ? 'text-green-400 transition-colors duration-200' : 'text-amber-400 transition-colors duration-200'}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Undo2 size={13} className={undoing ? 'text-green-400 transition-colors duration-200' : 'text-amber-400 transition-colors duration-200'} />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{action.label}</p>
        {action.description && (
          <p className="text-[10px] text-muted-foreground font-mono mt-px">{action.description}</p>
        )}
      </div>

      {/* Undo button */}
      <button
        onClick={handleUndo}
        disabled={undoing}
        className="shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide border border-amber-400/35 bg-amber-400/8 text-amber-400 hover:bg-amber-400/18 disabled:opacity-60 disabled:cursor-default transition-colors cursor-pointer"
      >
        {undoing ? '...' : 'ANNULER'}
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

export default function UndoToastContainer() {
  const actions = useUndoStore(s => s.actions)

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] pointer-events-none items-center">
      <AnimatePresence mode="sync">
        {actions.map(action => (
          <UndoToastItem key={action.id} action={action} />
        ))}
      </AnimatePresence>
    </div>
  )
}