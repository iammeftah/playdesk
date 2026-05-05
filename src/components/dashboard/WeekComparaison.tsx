import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatMAD } from '../../lib/utils'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface DayData { day: string; revenue: number; sessions: number }
interface WeekData { revenue: number; sessions: number; days: DayData[] }
interface ComparisonData {
  thisWeek: WeekData
  lastWeek: WeekData
  diff: { revenue: number; revenuePct: number; sessions: number; sessionsPct: number }
}

function DiffBadge({ pct }: { pct: number }) {
  if (pct === 0) return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> Identique
    </span>
  )
  const positive = pct > 0
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-green-500' : 'text-red-400'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{pct}%
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey.includes('revenue') ? formatMAD(p.value) : `${p.value} sessions`}
        </p>
      ))}
    </div>
  )
}

export default function WeekComparison() {
  const [data, setData]     = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.playdesk.dashboard.weekComparison()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="h-48 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
      Données insuffisantes
    </div>
  )

  // Build chart data — align by day-of-week index (0=Mon…6=Sun)
  const chartData = DAY_LABELS.map((label, i) => {
    const thisDay = data.thisWeek.days[i] as DayData | undefined
    const lastDay = data.lastWeek.days[i] as DayData | undefined
    return {
      day:              label,
      'Cette semaine':  thisDay?.revenue  ?? 0,
      'Semaine préc.':  lastDay?.revenue  ?? 0,
      thisSessions:     thisDay?.sessions ?? 0,
      lastSessions:     lastDay?.sessions ?? 0,
    }
  })

  const isDark = document.documentElement.classList.contains('dark')
  const gridClr = isDark ? '#1e1e1e' : '#e5e5e5'
  const tickClr = isDark ? '#737373' : '#a3a3a3'

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue card */}
        <div className="bg-muted rounded-xl px-4 py-3 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Revenus cette semaine</p>
          <p className="font-mono font-bold text-xl text-foreground">{formatMAD(data.thisWeek.revenue)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <DiffBadge pct={data.diff.revenuePct} />
            <span className="text-xs text-muted-foreground">vs sem. préc. ({formatMAD(data.lastWeek.revenue)})</span>
          </div>
        </div>
        {/* Sessions card */}
        <div className="bg-muted rounded-xl px-4 py-3 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Sessions cette semaine</p>
          <p className="font-mono font-bold text-xl text-foreground">{data.thisWeek.sessions}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <DiffBadge pct={data.diff.sessionsPct} />
            <span className="text-xs text-muted-foreground">vs sem. préc. ({data.lastWeek.sessions})</span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
          <XAxis dataKey="day" tick={{ fill: tickClr, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: tickClr, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: tickClr }} />
          <Bar dataKey="Cette semaine" fill="rgba(99,102,241,0.85)" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="Semaine préc." fill="rgba(99,102,241,0.25)" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}