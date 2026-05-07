import { formatMAD } from '../../lib/utils'

interface StationStat {
  name:     string
  sessions: number
  revenue:  number
}

export default function StationUtilization({ data }: { data: StationStat[] }) {
  if (!data.length) return (
    <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Aucune donnée
    </div>
  )

  const maxSessions = Math.max(...data.map(d => d.sessions), 1)
  const maxRevenue  = Math.max(...data.map(d => d.revenue),  1)

  return (
    <div className="w-full flex flex-col gap-4">

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 8, height: 8, borderRadius: '2px', background: 'var(--neon)' }} />
          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 8, height: 8, borderRadius: '2px', background: 'var(--neon-mid)' }} />
          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Revenus</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {data.map(s => {
          const sessionPct = (s.sessions / maxSessions) * 100
          const revenuePct = (s.revenue  / maxRevenue)  * 100
          const revenuePerSession = s.sessions > 0
            ? formatMAD(s.revenue / s.sessions)
            : '—'

          return (
            <div key={s.name} className="flex items-center gap-3">
              {/* Station name */}
              <div
                style={{
                  fontSize:   '11px',
                  fontWeight: 500,
                  color:      'var(--foreground)',
                  minWidth:   '44px',
                  flexShrink: 0,
                }}
              >
                {s.name}
              </div>

              {/* Bars */}
              <div className="flex-1 flex flex-col gap-1">
                {/* Sessions bar */}
                <div
                  title={`${s.sessions} session${s.sessions !== 1 ? 's' : ''}`}
                  style={{
                    height:       '6px',
                    borderRadius: '3px',
                    background:   'var(--muted)',
                    overflow:     'hidden',
                  }}
                >
                  <div
                    style={{
                      height:       '100%',
                      width:        `${sessionPct}%`,
                      borderRadius: '3px',
                      background:   'var(--neon)',
                      opacity:      0.85,
                      transition:   'width 0.4s ease',
                    }}
                  />
                </div>
                {/* Revenue bar */}
                <div
                  title={formatMAD(s.revenue)}
                  style={{
                    height:       '6px',
                    borderRadius: '3px',
                    background:   'var(--muted)',
                    overflow:     'hidden',
                  }}
                >
                  <div
                    style={{
                      height:       '100%',
                      width:        `${revenuePct}%`,
                      borderRadius: '3px',
                      background:   'var(--neon-mid)',
                      transition:   'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '60px' }}>
                <div style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 600, fontFamily: 'monospace' }}>
                  {formatMAD(s.revenue)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                  {revenuePerSession}/s
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}