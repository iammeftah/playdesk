import { Session } from '../types'

export function calcMatchPrice(matchDuration: number): number {
  if (matchDuration === 6) return 7
  if (matchDuration === 7) return 8
  return 10 // 8 minutes and above
}

export function calcSessionAmount(session: Session, elapsedSeconds: number): number {
  if (session.type === 'match') {
    return session.match_count * calcMatchPrice(session.match_duration ?? 8)
  }
  if (session.type === 'temps') {
    // Fixed price — always charge the full prepaid duration
    const hours = (session.prepaid_minutes ?? 60) / 60
    return hours * 30
  }
  // Libre: to the nearest minute, 30 MAD/h = 0.5 MAD/min
  const minutes = Math.ceil(elapsedSeconds / 60)
  return minutes * 0.5
}

export function getTempsProgress(session: Session, elapsedSeconds: number): {
  remaining: number
  isExpired: boolean
  isWarning: boolean
} {
  const total = (session.prepaid_minutes ?? 60) * 60
  const remaining = Math.max(0, total - elapsedSeconds)
  return {
    remaining,
    isExpired: remaining === 0,
    isWarning: remaining > 0 && remaining <= 300, // 5 min warning
  }
}
