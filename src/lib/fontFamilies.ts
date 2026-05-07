/**
 * fontFamilies.ts
 * Available font choices for PlayDesk — intentionally varied.
 * Loaded via Google Fonts @import in index.css (except Geist).
 */

export interface FontFamily {
  id:       string
  label:    string
  stack:    string
  category: string   // shown as group label in the picker
  preview:  string   // rendered in the font itself
}

export const FONT_FAMILIES: FontFamily[] = [
  // ── Modern Sans ───────────────────────────────────────────────────────────
  {
    id:       'geist',
    label:    'Geist',
    stack:    "'Geist Variable', sans-serif",
    category: 'Modern Sans',
    preview:  'Aa',
  },
  {
    id:       'inter',
    label:    'Inter',
    stack:    "'Inter', sans-serif",
    category: 'Modern Sans',
    preview:  'Aa',
  },
  {
    id:       'space-grotesk',
    label:    'Space Grotesk',
    stack:    "'Space Grotesk', sans-serif",
    category: 'Modern Sans',
    preview:  'Aa',
  },
  {
    id:       'syne',
    label:    'Syne',
    stack:    "'Syne', sans-serif",
    category: 'Modern Sans',
    preview:  'Aa',
  },

  // ── Serif / Editorial ─────────────────────────────────────────────────────
  {
    id:       'playfair',
    label:    'Playfair Display',
    stack:    "'Playfair Display', serif",
    category: 'Serif',
    preview:  'Aa',
  },
  {
    id:       'cormorant',
    label:    'Cormorant Garamond',
    stack:    "'Cormorant Garamond', serif",
    category: 'Serif',
    preview:  'Aa',
  },
  {
    id:       'dm-serif',
    label:    'DM Serif Display',
    stack:    "'DM Serif Display', serif",
    category: 'Serif',
    preview:  'Aa',
  },

  // ── Display / Bold ────────────────────────────────────────────────────────
  {
    id:       'bebas',
    label:    'Bebas Neue',
    stack:    "'Bebas Neue', sans-serif",
    category: 'Display',
    preview:  'AA',
  },

  // ── Monospace ─────────────────────────────────────────────────────────────
  {
    id:       'ibm-mono',
    label:    'IBM Plex Mono',
    stack:    "'IBM Plex Mono', monospace",
    category: 'Monospace',
    preview:  'Aa',
  },
  {
    id:       'space-mono',
    label:    'Space Mono',
    stack:    "'Space Mono', monospace",
    category: 'Monospace',
    preview:  'Aa',
  },
]

export const DEFAULT_FONT_ID = 'geist'

export function getFontById(id: string): FontFamily {
  return FONT_FAMILIES.find(f => f.id === id) ?? FONT_FAMILIES[0]
}

export const FONT_CATEGORIES = [...new Set(FONT_FAMILIES.map(f => f.category))]