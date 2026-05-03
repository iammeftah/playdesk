import { formatMAD } from '../../lib/utils'

export default function SummaryCards({ data }: { data: any }) {
  const byType = Object.fromEntries((data.byType ?? []).map((t: any) => [t.type, t.c]))

  const cards = [
    { label: 'Revenus du jour',  value: formatMAD(data.revenue ?? 0), sub: `${data.sessionCount ?? 0} sessions`, color: 'text-brand-400' },
    { label: 'Sessions Match',   value: byType.match ?? 0,  sub: 'parties jouées',   color: 'text-green-400' },
    { label: 'Sessions Temps',   value: byType.temps ?? 0,  sub: 'prépayées',        color: 'text-yellow-400' },
    { label: 'Sessions Libres',  value: byType.libre ?? 0,  sub: 'au compteur',      color: 'text-purple-400' },
    { label: 'Durée moyenne',    value: `${data.avgDuration ?? 0} min`, sub: 'par session',  color: 'text-blue-400' },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
          <p className="text-surface-400 text-xs mb-2">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-surface-500 text-xs mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
