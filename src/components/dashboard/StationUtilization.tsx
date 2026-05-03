import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatMAD } from '../../lib/utils'

const COLORS = ['#2456f6','#22c55e','#eab308','#a855f7','#ef4444','#06b6d4']

export default function StationUtilization({ data }: { data: any[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-surface-500 text-sm">Aucune donnée</div>

  return (
    <div className="flex flex-col gap-3">
      {data.map((s, i) => {
        const max = Math.max(...data.map(d => d.revenue), 1)
        const pct = Math.round((s.revenue / max) * 100)
        return (
          <div key={s.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-surface-300 font-medium">{s.name}</span>
              <span className="text-surface-400">{s.sessions} sessions · {formatMAD(s.revenue)}</span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
