import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMAD } from '../../lib/utils'

const TYPE_META: Record<string, { label: string; color: string; dimColor: string }> = {
  match: { label: 'Match',  color: 'rgba(99,102,241,1)',   dimColor: 'rgba(99,102,241,0.15)'  },
  temps: { label: 'Temps',  color: 'rgba(251,191,36,1)',   dimColor: 'rgba(251,191,36,0.15)'  },
  libre: { label: 'Libre',  color: 'rgba(167,139,250,0.7)', dimColor: 'rgba(167,139,250,0.12)' },
}

interface TypeStat {
  type:    string
  c:       number
  revenue?: number
}

interface Props {
  byType: TypeStat[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d    = payload[0].payload
  const meta = TYPE_META[d.type] ?? { label: d.type, color: '#888' }
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{
        background: 'var(--card)',
        border:     '1px solid var(--border)',
        color:      'var(--foreground)',
      }}
    >
      <p className="font-semibold mb-0.5" style={{ color: meta.color }}>{meta.label}</p>
      <p style={{ color: 'var(--muted-foreground)' }}>{d.c} session{d.c !== 1 ? 's' : ''}</p>
      <p style={{ color: 'var(--muted-foreground)' }}>{d.pct}% du total</p>
      {d.revenue != null && (
        <p className="mt-0.5 font-mono font-bold" style={{ color: meta.color }}>
          {formatMAD(d.revenue)}
        </p>
      )}
    </div>
  )
}

export default function SessionTypePie({ byType }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (!byType?.length) return (
    <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Aucune donnée
    </div>
  )

  const total = byType.reduce((s, t) => s + (t.c ?? 0), 0) || 1
  const data  = byType.map(t => ({
    ...t,
    pct: Math.round((t.c / total) * 100),
  }))

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut */}
      <div style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              dataKey="c"
              paddingAngle={3}
              strokeWidth={0}
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((entry, i) => {
                const meta = TYPE_META[entry.type] ?? { color: '#888', dimColor: '#333' }
                const isActive = activeIdx === null || activeIdx === i
                return (
                  <Cell
                    key={entry.type}
                    fill={meta.color}
                    opacity={isActive ? 1 : 0.25}
                    style={{ cursor: 'default', transition: 'opacity 0.15s' }}
                  />
                )
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full">
        {data.map((entry, i) => {
          const meta     = TYPE_META[entry.type] ?? { label: entry.type, color: '#888' }
          const isActive = activeIdx === null || activeIdx === i
          return (
            <div
              key={entry.type}
              className="flex items-center justify-between cursor-default"
              style={{ opacity: isActive ? 1 : 0.35, transition: 'opacity 0.15s' }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 500 }}>
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  {entry.c} session{entry.c !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '11px', color: meta.color, fontWeight: 600, fontFamily: 'monospace', minWidth: '32px', textAlign: 'right' }}>
                  {entry.pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}