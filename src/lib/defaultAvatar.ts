/**
 * defaultAvatar.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates the default placeholder avatar SVG using the current accent color
 * (--neon CSS variable) so it follows the user's chosen accent theme.
 *
 * Usage:
 *   import { getDefaultAvatar } from '@/lib/defaultAvatar'
 *   const avatar = getDefaultAvatar()   // call at render time, not module level
 */

export function getDefaultAvatar(): string {
  // Read the current accent color at call time
  const neon = getComputedStyle(document.documentElement)
    .getPropertyValue('--neon').trim() || '#6366f1'

  // Build a muted bg from the neon color at low opacity using color-mix,
  // but since SVG fill doesn't support CSS vars we compute hex-like values manually.
  // Strategy: use the neon hue at ~12% opacity over near-black for the bg rect,
  // and ~28% opacity for the figure shapes.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs>
      <style>
        .bg   { fill: ${neon}; opacity: 0.12; }
        .fig  { fill: ${neon}; opacity: 0.30; }
        .base { fill: #0d0d0d; }
      </style>
    </defs>
    <rect width="40" height="40" rx="10" class="base"/>
    <rect width="40" height="40" rx="10" class="bg"/>
    <circle cx="20" cy="15" r="7" class="fig"/>
    <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" class="fig"/>
  </svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}