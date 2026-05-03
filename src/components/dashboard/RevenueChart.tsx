import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: any[]; period: string }

// Read CSS var value at runtime (for recharts which needs actual color strings)
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export default function RevenueChart({ data, period }: Props) {
  // Detect dark mode
  const isDark  = document.documentElement.classList.contains('dark')
  const tickClr = isDark ? '#737373' : '#a3a3a3'
  const gridClr = isDark ? '#1e1e1e' : '#e5e5e5'
  const bgClr   = isDark ? '#141414' : '#ffffff'
  const borderClr = isDark ? '#2a2a2a' : '#e5e5e5'
  const textClr = isDark ? '#fafafa' : '#0a0a0a'

  if (!data.length) return (
    <div
      className="h-48 flex items-center justify-center text-sm"
      style={{ color: 'var(--muted-foreground)' }}
    >
      Aucune donnée pour cette période
    </div>
  )

  const formatted = data.map(d => ({ ...d, value: parseFloat(d.value ?? 0) }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={isDark ? 0.3 : 0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
        <XAxis
          dataKey="label"
          tick={{ fill: tickClr, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: tickClr, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v} MAD`}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: bgClr,
            border: `1px solid ${borderClr}`,
            borderRadius: 10,
            color: textClr,
            fontSize: 12,
          }}
          formatter={(v: any) => [`${parseFloat(v).toFixed(2)} MAD`, 'Revenus']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}