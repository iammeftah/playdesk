export default function PeakHoursHeatmap({ data }: { data: any[] }) {
  const hours  = Array.from({ length: 24 }, (_, i) => i)
  const byHour = Object.fromEntries(data.map(d => [parseInt(d.hour), d.count]))
  const max    = Math.max(...(Object.values(byHour) as number[]), 1)

  // Returns inline style rather than Tailwind classes so it works in both modes
  const getCellStyle = (h: number): React.CSSProperties => {
    const v = (byHour[h] ?? 0) / max
    if (v === 0)   return { background: 'var(--muted)' }
    if (v < 0.25)  return { background: 'rgba(99,102,241,0.15)' }
    if (v < 0.5)   return { background: 'rgba(99,102,241,0.35)' }
    if (v < 0.75)  return { background: 'rgba(99,102,241,0.6)' }
    return             { background: 'rgba(99,102,241,0.85)' }
  }

  const legendStops = [
    { style: { background: 'var(--muted)' } },
    { style: { background: 'rgba(99,102,241,0.15)' } },
    { style: { background: 'rgba(99,102,241,0.35)' } },
    { style: { background: 'rgba(99,102,241,0.6)' } },
    { style: { background: 'rgba(99,102,241,0.85)' } },
  ]

  return (
    <div>
      <div className="grid grid-cols-12 gap-1 mb-2">
        {hours.map(h => (
          <div key={h} className="flex flex-col items-center gap-1">
            <div
              className="w-full h-6 rounded transition-colors"
              style={getCellStyle(h)}
              title={`${h}h: ${byHour[h] ?? 0} sessions`}
            />
            {h % 4 === 0 && (
              <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
                {h}h
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Faible</span>
        <div className="flex gap-0.5 flex-1">
          {legendStops.map((s, i) => (
            <div key={i} className="flex-1 h-2 rounded" style={s.style} />
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Fort</span>
      </div>
    </div>
  )
}