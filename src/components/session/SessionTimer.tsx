import { formatTime } from '../../lib/utils'
export default function SessionTimer({ seconds }: { seconds: number }) {
  return <span className="font-mono text-4xl font-bold text-white">{formatTime(seconds)}</span>
}
