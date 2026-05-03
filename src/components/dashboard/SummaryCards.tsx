import { motion } from 'framer-motion'
import { formatMAD } from '../../lib/utils'

export default function SummaryCards({ data }: { data: any }) {
  const byType = Object.fromEntries((data.byType ?? []).map((t: any) => [t.type, t.c]))

  const cards = [
    { label: 'Revenus',    value: formatMAD(data.revenue ?? 0), sub: `${data.sessionCount ?? 0} sessions`, mono: true,  accent: true  },
    { label: 'Match',      value: byType.match ?? 0,             sub: 'parties jouées',                    mono: false, accent: false },
    { label: 'Temps',      value: byType.temps ?? 0,             sub: 'prépayées',                         mono: false, accent: false },
    { label: 'Libre',      value: byType.libre ?? 0,             sub: 'au compteur',                       mono: false, accent: false },
    { label: 'Durée moy.', value: `${data.avgDuration ?? 0}`,   sub: 'minutes/session',                   mono: true,  accent: false },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-xl p-4 flex flex-col"
          style={{
            background:   c.accent ? 'var(--neon-dim)' : 'var(--card)',
            border:       c.accent ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border)',
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {c.label}
          </p>
          <p
            className={`text-2xl font-bold leading-none ${c.mono ? 'font-mono' : ''}`}
            style={{ color: c.accent ? 'var(--neon)' : 'var(--foreground)' }}
          >
            {c.value}
          </p>
          <p className="text-[10px] mt-2 tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            {c.sub}
          </p>
        </motion.div>
      ))}
    </div>
  )
}