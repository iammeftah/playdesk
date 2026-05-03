export default function Badge({ label, color = 'blue' }: { label: string; color?: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-900/50 text-${color}-400`}>{label}</span>
}
