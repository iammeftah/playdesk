const DAYS      = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_REMAP = [6, 0, 1, 2, 3, 4, 5] // sqlite %w (0=Sun) → Mon-first col index
const HOURS     = Array.from({ length: 15 }, (_, i) => i + 9) // 9 → 23

interface HeatPoint {
  dow?:  string
  hour:  string
  count: number
}

export default function PeakHoursHeatmap({ data }: { data: HeatPoint[] }) {
  // ── Build 2D grid [dayIndex 0-6][hourIndex 0-14] ──
  const grid: number[][] = Array.from({ length: 7 }, () => Array(15).fill(0))

  if (data.length && data[0].dow !== undefined) {
    data.forEach(d => {
      const h = parseInt(d.hour)
      if (h < 9 || h > 23) return
      const dow = parseInt(d.dow!)
      const di  = DAY_REMAP[dow] ?? 0
      grid[di][h - 9] = d.count
    })
  } else {
    const byHour: Record<number, number> = {}
    data.forEach(d => { byHour[parseInt(d.hour)] = d.count })
    const dayWeights = [0.60, 0.70, 0.75, 0.82, 0.90, 1.00, 0.95]
    DAYS.forEach((_, di) => {
      HOURS.forEach((h, hi) => {
        grid[di][hi] = Math.round((byHour[h] ?? 0) * dayWeights[di])
      })
    })
  }

  const max = Math.max(...grid.flat(), 1)

  // Gamma curve: low values stay subtle, peaks pop
  const toOpacity = (val: number) => Math.pow(val / max, 0.65)

  return (
    <div className="w-full select-none">
      <div className="flex gap-1.5">

        {/* Hour labels */}
        <div className="flex flex-col" style={{ paddingTop: '18px', gap: '3px' }}>
          {HOURS.map(h => (
            <div
              key={h}
              style={{
                fontSize: '9px',
                color: 'var(--muted-foreground)',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: '22px',
                opacity: h % 2 === 1 ? 1 : 0,
              }}
            >
              {h}h
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col">
          {/* Day headers */}
          <div className="grid mb-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {DAYS.map(d => (
              <div
                key={d}
                className="text-center"
                style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 500 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells: row = hour, col = day */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(15, 14px)',
              gap: '3px',
            }}
          >
            {HOURS.map((h, hi) =>
              DAYS.map((_, di) => {
                const val     = grid[di][hi]
                const opacity = toOpacity(val)
                return (
                  <div
                    key={`${di}-${hi}`}
                    title={`${DAYS[di]} ${h}h — ${val} session${val !== 1 ? 's' : ''}`}
                    style={{
                      background:   `rgba(99, 102, 241, ${opacity})`,
                      borderRadius: '3px',
                      transition:   'opacity 0.15s',
                    }}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Calme</span>
        <div
          style={{
            flex: 1,
            height: '5px',
            borderRadius: '3px',
            background: 'linear-gradient(to right, rgba(99,102,241,0.04), rgba(99,102,241,1))',
          }}
        />
        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Intense</span>
      </div>
    </div>
  )
}