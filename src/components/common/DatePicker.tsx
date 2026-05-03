import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface Props {
  value: string           // YYYY-MM-DD
  onChange: (v: string) => void
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function DatePicker({ value, onChange }: Props) {
  const today    = new Date()
  const selected = value ? new Date(value + 'T00:00:00') : today

  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const firstDay    = new Date(viewYear, viewMonth, 1)
  const lastDay     = new Date(viewYear, viewMonth + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d))

  const displayDate = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Choisir une date'

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-sm transition-colors"
        style={{
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--muted-foreground)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
        <span className="font-mono text-xs">{displayDate}</span>
      </button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="cal-popup absolute right-0 top-10 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="cal-day">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--foreground)' }}>
                {MONTHS_FR[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="cal-day">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map(d => (
                <div
                  key={d}
                  className="h-8 flex items-center justify-center text-[10px] font-semibold tracking-wider"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((date, i) => {
                if (!date) return <div key={`e-${i}`} />
                const iso        = toISO(date)
                const isToday    = iso === toISO(today)
                const isSelected = iso === value
                return (
                  <button
                    key={iso}
                    onClick={() => { onChange(iso); setOpen(false) }}
                    className={[
                      'cal-day',
                      isSelected ? 'selected' : '',
                      isToday && !isSelected ? 'today' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div
              className="mt-3 pt-3 flex justify-between items-center"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={() => { onChange(toISO(today)); setOpen(false) }}
                className="text-[11px] transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-[11px] transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}