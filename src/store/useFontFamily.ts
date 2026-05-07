/**
 * useFontFamily.ts
 * Manages the dynamic font family for PlayDesk.
 * Writes --app-font on :root; index.css's `* { font-family: var(--app-font) }` picks it up.
 *
 * Usage:
 *   const { fontId, setFont } = useFontFamily()
 *
 * On startup (in App.tsx, before first render):
 *   import { initFont } from './lib/useFontFamily'
 *   initFont()
 */

import { useState, useCallback } from 'react'
import { getFontById, DEFAULT_FONT_ID, FontFamily } from '../lib/fontFamilies'

const STORAGE_KEY = 'playdesk_font'

// ── Core injector ─────────────────────────────────────────────────────────────
function injectFontVar(font: FontFamily) {
  document.documentElement.style.setProperty('--app-font', font.stack)
}

// ── Public one-shot init (call before React renders) ─────────────────────────
export function initFont() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_FONT_ID
  injectFontVar(getFontById(saved))
}

// ── React hook ───────────────────────────────────────────────────────────────
export function useFontFamily() {
  const [fontId, setFontId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_FONT_ID
  )

  const setFont = useCallback((id: string) => {
    const font = getFontById(id)
    localStorage.setItem(STORAGE_KEY, id)
    setFontId(id)
    injectFontVar(font)
  }, [])

  return { fontId, setFont }
}