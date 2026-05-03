type Status = 'libre' | 'active' | 'pause' | 'expired'

const config = {
  libre:   { label: 'LIBRE',    classes: 'bg-surface-800 text-surface-400 border-surface-700' },
  active:  { label: 'ACTIVE',   classes: 'bg-green-900/50 text-green-400 border-green-700' },
  pause:   { label: 'EN PAUSE', classes: 'bg-yellow-900/50 text-yellow-400 border-yellow-700' },
  expired: { label: 'EXPIRÉ',   classes: 'bg-red-900/50 text-red-400 border-red-700' },
}

export default function StationBadge({ status }: { status: Status }) {
  const { label, classes } = config[status]
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border tracking-wider ${classes}`}>
      {label}
    </span>
  )
}
