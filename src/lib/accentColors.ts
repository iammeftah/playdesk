/**
 * accentColors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Preset accent palette for PlayDesk.
 * Each entry provides:
 *   - hex        → the base color (light mode --neon)
 *   - hexDark    → slightly lighter variant (dark mode --neon)
 *   - r, g, b    → numeric channels of hexDark (used to build rgba() strings)
 */

export interface AccentColor {
  id:      string
  label:   string
  hex:     string   // light mode --neon
  hexDark: string   // dark  mode --neon
  r: number         // RGB of hexDark
  g: number
  b: number
}

export const ACCENT_COLORS: AccentColor[] = [
  // ── Default ──────────────────────────────────────────────────────────────
  {
    id: 'indigo',
    label: 'Indigo',
    hex:     '#6366f1',
    hexDark: '#818cf8',
    r: 129, g: 140, b: 248,
  },
  // ── Violet ───────────────────────────────────────────────────────────────
  {
    id: 'violet',
    label: 'Violet',
    hex:     '#8b5cf6',
    hexDark: '#a78bfa',
    r: 167, g: 139, b: 250,
  },
  // ── Purple ───────────────────────────────────────────────────────────────
  {
    id: 'purple',
    label: 'Purple',
    hex:     '#a855f7',
    hexDark: '#c084fc',
    r: 192, g: 132, b: 252,
  },
  // ── Pink ─────────────────────────────────────────────────────────────────
  {
    id: 'pink',
    label: 'Rose',
    hex:     '#ec4899',
    hexDark: '#f472b6',
    r: 244, g: 114, b: 182,
  },
  // ── Red ──────────────────────────────────────────────────────────────────
  {
    id: 'red',
    label: 'Rouge',
    hex:     '#ef4444',
    hexDark: '#f87171',
    r: 248, g: 113, b: 113,
  },
  // ── Orange ───────────────────────────────────────────────────────────────
  {
    id: 'orange',
    label: 'Orange',
    hex:     '#f97316',
    hexDark: '#fb923c',
    r: 251, g: 146, b: 60,
  },
  // ── Amber ────────────────────────────────────────────────────────────────
  {
    id: 'amber',
    label: 'Ambre',
    hex:     '#f59e0b',
    hexDark: '#fbbf24',
    r: 251, g: 191, b: 36,
  },
  // ── Emerald ──────────────────────────────────────────────────────────────
  {
    id: 'emerald',
    label: 'Émeraude',
    hex:     '#10b981',
    hexDark: '#34d399',
    r: 52, g: 211, b: 153,
  },
  // ── Cyan ─────────────────────────────────────────────────────────────────
  {
    id: 'cyan',
    label: 'Cyan',
    hex:     '#06b6d4',
    hexDark: '#22d3ee',
    r: 34, g: 211, b: 238,
  },
  // ── Sky ──────────────────────────────────────────────────────────────────
  {
    id: 'sky',
    label: 'Ciel',
    hex:     '#0ea5e9',
    hexDark: '#38bdf8',
    r: 56, g: 189, b: 248,
  },
]

export const DEFAULT_ACCENT_ID = 'indigo'

export function getAccentById(id: string): AccentColor {
  return ACCENT_COLORS.find(a => a.id === id) ?? ACCENT_COLORS[0]
}