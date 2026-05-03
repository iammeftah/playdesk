type Status = 'libre' | 'active' | 'pause' | 'expired'

const config: Record<Status, {
  label: string
  dotStyle: React.CSSProperties
  pillStyle: React.CSSProperties
}> = {
  libre: {
    label: 'LIBRE',
    dotStyle: { background: 'var(--muted-foreground)', opacity: 0.4 },
    pillStyle: {
      background: 'var(--muted)',
      color: 'var(--muted-foreground)',
      border: '1px solid var(--border)',
    },
  },
  active: {
    label: 'ACTIVE',
    dotStyle: { background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.7)' },
    pillStyle: {
      background: 'rgba(74,222,128,0.08)',
      color: '#4ade80',
      border: '1px solid rgba(74,222,128,0.2)',
    },
  },
  pause: {
    label: 'PAUSE',
    dotStyle: { background: '#fbbf24' },
    pillStyle: {
      background: 'rgba(251,191,36,0.08)',
      color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.2)',
    },
  },
  expired: {
    label: 'EXPIRÉ',
    dotStyle: { background: '#f87171' },
    pillStyle: {
      background: 'rgba(239,68,68,0.08)',
      color: '#f87171',
      border: '1px solid rgba(239,68,68,0.2)',
    },
  },
}

export default function StationBadge({ status }: { status: Status }) {
  const { label, dotStyle, pillStyle } = config[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded tracking-[0.15em]"
      style={pillStyle}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'expired' ? 'animate-pulse' : ''}`}
        style={dotStyle}
      />
      {label}
    </span>
  )
}