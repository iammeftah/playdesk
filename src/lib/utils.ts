import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a duration in SECONDS to "Xh XXm XXs" or "XX:XX:XX".
 * Bug fix: the previous implementation was treating the input as minutes.
 * Input is always raw seconds from computeElapsed().
 */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')

  if (h > 0) {
    return `${h}h ${mm}m`
  }
  return `${mm}:${ss}`
}

/** Format amount as MAD currency */
export function formatMAD(amount: number): string {
  return `${Number(amount).toFixed(2)} MAD`
}

/** Format a date string to locale */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/** Returns today's date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}