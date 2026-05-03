export default function PeakHoursHeatmap({ data }: { data: any[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const byHour = Object.fromEntries(data.map(d => [parseInt(d.hour), d.count]))
  const max = Math.max(...Object.values(byHour) as number[], 1)

  const getColor = (h: number) => {
    const v = (byHour[h] ?? 0) / max
    if (v === 0) return 'bg-surface-800'
    if (v < 0.25) return 'bg-brand-900'
    if (v < 0.5)  return 'bg-brand-700'
    if (v < 0.75) return 'bg-brand-500'
    return 'bg-brand-400'
  }

  return (
    <div>
      <div className="grid grid-cols-12 gap-1 mb-2">
        {hours.map(h => (
          <div key={h} className="flex flex-col items-center gap-1">
            <div className={`w-full h-6 rounded ${getColor(h)} transition-colors`}
              title={`${h}h: ${byHour[h] ?? 0} sessions`} />
            {h % 4 === 0 && <span className="text-surface-500 text-[9px]">{h}h</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-surface-500 text-xs">Faible</span>
        <div className="flex gap-0.5 flex-1">
          {['bg-surface-800','bg-brand-900','bg-brand-700','bg-brand-500','bg-brand-400'].map((c,i) => (
            <div key={i} className={`flex-1 h-2 rounded ${c}`} />
          ))}
        </div>
        <span className="text-surface-500 text-xs">Fort</span>
      </div>
    </div>
  )
}
