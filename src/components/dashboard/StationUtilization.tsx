import { formatMAD } from '../../lib/utils'

export default function StationUtilization({ data }: { data: any[] }) {
  if (!data.length) return (
    <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Aucune donnée
    </div>
  )

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="flex flex-col gap-3">
      {data.map((s, i) => {
        const pct     = Math.round((s.revenue / maxRevenue) * 100)
        // Vary opacity so bars feel distinct but all stay on-brand
        const opacity = 0.5 + (1 - i / data.length) * 0.5
        return (
          <div key={s.name}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>
                {s.sessions} session{s.sessions !== 1 ? 's' : ''} · {formatMAD(s.revenue)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${pct}%`,
                  background: 'var(--neon)',
                  opacity,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}