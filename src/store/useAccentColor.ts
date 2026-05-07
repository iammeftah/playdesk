/**
 * useAccentColor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the dynamic accent color for PlayDesk.
 *
 * It injects --neon, --neon-dim, --neon-mid, --neon-glow, --primary (light),
 * --ring, --chart-1..5, and the shadcn focus ring on :root and .dark.
 *
 * Usage:
 *   const { accentId, setAccent } = useAccentColor()
 *
 * On startup (in App.tsx before first render):
 *   import { initAccent } from './lib/useAccentColor'
 *   initAccent()
 */

import { useState, useCallback, useEffect } from 'react'
import { getAccentById, DEFAULT_ACCENT_ID, AccentColor } from '../lib/accentColors'

const STORAGE_KEY = 'playdesk_accent'

// ── Core injector ─────────────────────────────────────────────────────────────
function injectAccentVars(accent: AccentColor) {
  const root  = document.documentElement
  const isDark = root.classList.contains('dark')

  const hex    = isDark ? accent.hexDark : accent.hex
  const { r, g, b } = accent   // channels of hexDark (close enough for both modes)

  // --neon family
  root.style.setProperty('--neon',      hex)
  root.style.setProperty('--neon-dim',  `rgba(${r}, ${g}, ${b}, 0.08)`)
  root.style.setProperty('--neon-mid',  `rgba(${r}, ${g}, ${b}, 0.15)`)
  root.style.setProperty('--neon-glow', `rgba(${r}, ${g}, ${b}, 0.06)`)

  // --primary mirrors --neon in light mode (used by shadcn Button default variant, etc.)
  if (!isDark) {
    root.style.setProperty('--primary',          hex)
    root.style.setProperty('--primary-foreground', '#ffffff')
  } else {
    // In dark mode restore to the original neutral primary
    root.style.setProperty('--primary',          '#e5e5e5')
    root.style.setProperty('--primary-foreground', '#0a0a0a')
  }

  // --ring (focus rings)
  root.style.setProperty('--ring', `rgba(${r}, ${g}, ${b}, 0.5)`)

  // chart colors (cascade from the neon hue)
  root.style.setProperty('--chart-1', hex)
  root.style.setProperty('--chart-2', isDark ? accent.hexDark : accent.hex)
  root.style.setProperty('--chart-3', `rgba(${r}, ${g}, ${b}, 0.6)`)
  root.style.setProperty('--chart-4', `rgba(${r}, ${g}, ${b}, 0.35)`)
  root.style.setProperty('--chart-5', `rgba(${r}, ${g}, ${b}, 0.15)`)

  // Update the global CSS focus-visible ring color dynamically
  // (overrides the hardcoded rgba(99,102,241,0.5) in index.css)
  const styleId = '__playdesk_accent_style__'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }
  // Notify listeners (e.g. default avatar) that the accent color changed
  window.dispatchEvent(new CustomEvent('playdesk:accent-updated'))

  styleEl.textContent = `
    button:focus-visible,
    [role="button"]:focus-visible,
    a:focus-visible {
      box-shadow: 0 0 0 1.5px rgba(${r}, ${g}, ${b}, 0.5) !important;
    }
    .settings-input:focus {
      border-color: rgba(${r}, ${g}, ${b}, 0.5) !important;
    }
    [data-slot="input"]:focus {
      border-color: rgba(${r}, ${g}, ${b}, 0.5) !important;
    }
    [data-slot="card"]:hover {
      border-color: rgba(${r}, ${g}, ${b}, 0.2) !important;
      box-shadow: 0 0 20px rgba(${r}, ${g}, ${b}, 0.08), 0 4px 24px rgba(0,0,0,0.06) !important;
    }
    .dark [data-slot="card"]:hover {
      box-shadow: 0 0 24px rgba(${r}, ${g}, ${b}, 0.06), 0 8px 40px rgba(0,0,0,0.5) !important;
    }
    .glow-card:hover {
      border-color: rgba(${r}, ${g}, ${b}, 0.2) !important;
      box-shadow: 0 0 20px rgba(${r}, ${g}, ${b}, 0.08), 0 4px 20px rgba(0,0,0,0.06) !important;
    }
    .stat-card:hover {
      border-color: rgba(${r}, ${g}, ${b}, 0.2) !important;
      box-shadow: 0 0 20px rgba(${r}, ${g}, ${b}, 0.08), 0 4px 20px rgba(0,0,0,0.06) !important;
    }
    .theme-option:hover {
      border-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
    }
    .theme-option.selected {
      border-color: ${hex} !important;
      box-shadow: 0 0 0 1px ${hex}, 0 0 16px rgba(${r}, ${g}, ${b}, 0.08) !important;
    }
    .cal-popup {
      box-shadow: 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.08), 0 16px 48px rgba(0,0,0,0.12) !important;
    }
    .dark .cal-popup {
      box-shadow: 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.08), 0 20px 60px rgba(0,0,0,0.8) !important;
    }
    .cal-day.today    { color: ${hex} !important; }
    .cal-day.selected { background: rgba(${r}, ${g}, ${b}, 0.15) !important; color: ${hex} !important; }
    [data-slot="alert-dialog-content"],
    [data-slot="dialog-content"] {
      box-shadow: 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.06), 0 20px 60px rgba(0,0,0,0.15) !important;
    }
    .dark [data-slot="alert-dialog-content"],
    .dark [data-slot="dialog-content"] {
      box-shadow: 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.08), 0 24px 64px rgba(0,0,0,0.8) !important;
    }
  `
}

// ── Public one-shot init (call before React renders) ─────────────────────────
export function initAccent() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ACCENT_ID
  const accent = getAccentById(saved)
  injectAccentVars(accent)
}

// ── React hook ───────────────────────────────────────────────────────────────
export function useAccentColor() {
  const [accentId, setAccentId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ACCENT_ID
  )

  // Re-inject whenever theme class changes (dark ↔ light toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const accent = getAccentById(accentId)
      injectAccentVars(accent)
    })
    observer.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [accentId])

  const setAccent = useCallback((id: string) => {
    const accent = getAccentById(id)
    localStorage.setItem(STORAGE_KEY, id)
    setAccentId(id)
    injectAccentVars(accent)
  }, [])

  return { accentId, setAccent }
}