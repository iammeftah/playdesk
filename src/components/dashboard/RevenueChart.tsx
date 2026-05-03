import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: any[]; period: string }

export default function RevenueChart({ data, period }: Props) {
  if (!data.length) return (
    <div className="h-48 flex items-center justify-center text-surface-500 text-sm">
      Aucune donnée pour cette période
    </div>
  )

  const formatted = data.map(d => ({
    ...d,
    label: d.label,
    value: parseFloat(d.value ?? 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2456f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2456f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
        <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={v => `${v} MAD`} width={70} />
        <Tooltip
          contentStyle={{ background: '#141726', border: '1px solid #1e2235', borderRadius: 8, color: '#f0f2f8' }}
          formatter={(v: any) => [`${parseFloat(v).toFixed(2)} MAD`, 'Revenus']}
        />
        <Area type="monotone" dataKey="value" stroke="#2456f6" strokeWidth={2}
          fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#2456f6' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
