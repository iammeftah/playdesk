import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { ACCENT_COLORS } from '../../lib/accentColors'
import { FONT_FAMILIES, FONT_CATEGORIES } from '../../lib/fontFamilies'
import { useAccentColor } from '@/store/useAccentColor'
import { useFontFamily } from '@/store/useFontFamily'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export default function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('playdesk_theme') as Theme) ?? 'dark'
  })

  const { accentId, setAccent } = useAccentColor()
  const { fontId,   setFont   } = useFontFamily()

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('playdesk_theme', theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const options: {
    value: Theme
    label: string
    desc: string
    icon: React.ReactNode
    preview: React.ReactNode
  }[] = [
    {
      value: 'light',
      label: 'Clair',
      desc: 'Interface lumineuse sur fond blanc',
      icon: <Sun className="w-3.5 h-3.5" />,
      preview: (
        <div className="w-full h-14 rounded-md overflow-hidden flex flex-col" style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}>
          <div className="h-3.5 flex items-center px-2 gap-1.5" style={{ background: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
            <div className="w-6 h-1 rounded-full" style={{ background: '#0a0a0a', opacity: 0.15 }} />
          </div>
          <div className="flex flex-1">
            <div className="w-6 h-full" style={{ background: '#ffffff', borderRight: '1px solid #e5e5e5' }} />
            <div className="flex-1 p-1 flex flex-col gap-1">
              <div className="h-1 w-3/4 rounded" style={{ background: '#e5e5e5' }} />
              <div className="h-1 w-1/2 rounded" style={{ background: '#e5e5e5' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'dark',
      label: 'Sombre',
      desc: 'Interface sombre sur fond noir',
      icon: <Moon className="w-3.5 h-3.5" />,
      preview: (
        <div className="w-full h-14 rounded-md overflow-hidden flex flex-col" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
          <div className="h-3.5 flex items-center px-2 gap-1.5" style={{ background: '#141414', borderBottom: '1px solid #1e1e1e' }}>
            <div className="w-6 h-1 rounded-full" style={{ background: '#fafafa', opacity: 0.15 }} />
          </div>
          <div className="flex flex-1">
            <div className="w-6 h-full" style={{ background: '#0e0e0e', borderRight: '1px solid #1e1e1e' }} />
            <div className="flex-1 p-1 flex flex-col gap-1">
              <div className="h-1 w-3/4 rounded" style={{ background: '#2a2a2a' }} />
              <div className="h-1 w-1/2 rounded" style={{ background: '#2a2a2a' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'system',
      label: 'Système',
      desc: "Suit les préférences de l'OS",
      icon: <Monitor className="w-3.5 h-3.5" />,
      preview: (
        <div className="w-full h-14 rounded-md overflow-hidden flex" style={{ border: '1px solid var(--border)' }}>
          <div className="flex-1 flex flex-col" style={{ background: '#fafafa' }}>
            <div className="h-3.5" style={{ background: '#ffffff', borderBottom: '1px solid #e5e5e5' }} />
            <div className="flex-1 p-1">
              <div className="h-1 w-3/4 rounded" style={{ background: '#e5e5e5' }} />
            </div>
          </div>
          <div className="flex-1 flex flex-col" style={{ background: '#0a0a0a' }}>
            <div className="h-3.5" style={{ background: '#141414', borderBottom: '1px solid #1e1e1e' }} />
            <div className="flex-1 p-1">
              <div className="h-1 w-3/4 rounded" style={{ background: '#2a2a2a' }} />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const activeOption = options.find(o => o.value === theme)!
  const activeAccent = ACCENT_COLORS.find(a => a.id === accentId) ?? ACCENT_COLORS[0]
  const activeFont   = FONT_FAMILIES.find(f => f.id === fontId)   ?? FONT_FAMILIES[0]

  return (
    <div className="w-full">
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Choisissez l'apparence de l'interface. Le mode système suit automatiquement les préférences de votre OS.
      </p>

      {/* ── Theme selector ── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {options.map(opt => {
          const active = theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex flex-col gap-2 p-2.5 text-left relative"
              style={{
                background:   active ? 'var(--neon-dim)' : 'var(--muted)',
                border:       active ? '1.5px solid var(--neon)' : '1.5px solid var(--border)',
                borderRadius: '10px',
                cursor:       'pointer',
                transition:   'border-color 0.15s ease, background 0.15s ease',
                boxShadow:    active ? '0 0 0 1px var(--neon-dim)' : 'none',
              }}
            >
              {active && (
                <span
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--neon)', boxShadow: '0 0 5px var(--neon)' }}
                />
              )}
              {opt.preview}
              <div className="flex items-center gap-1.5">
                <span style={{ color: active ? 'var(--neon)' : 'var(--muted-foreground)' }}>
                  {opt.icon}
                </span>
                <p className="text-xs font-semibold" style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {opt.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Current mode info ── */}
      <div
        className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-full mb-6"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--neon-mid)', color: 'var(--neon)' }}
        >
          {activeOption.icon}
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            Mode {activeOption.label}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {activeOption.desc}
          </p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* ── Accent color section ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--muted-foreground)' }}>
          Couleur d'accentuation
        </p>
        <p className="text-[11px] mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Appliquée aux boutons, indicateurs actifs, graphiques et surbrillances.
        </p>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {ACCENT_COLORS.map(accent => {
            const isActive = accentId === accent.id
            return (
              <button
                key={accent.id}
                onClick={() => setAccent(accent.id)}
                title={accent.label}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all relative"
                style={{
                  background:   isActive ? `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.1)` : 'var(--muted)',
                  border:       isActive ? `1.5px solid ${accent.hexDark}` : '1.5px solid var(--border)',
                  borderRadius: '10px',
                  cursor:       'pointer',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: accent.hex,
                    boxShadow: isActive
                      ? `0 0 0 2px var(--card), 0 0 0 3.5px ${accent.hex}, 0 0 12px rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.5)`
                      : 'none',
                  }}
                >
                  {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <p
                  className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {accent.label}
                </p>
              </button>
            )
          })}
        </div>

        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-full"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `rgba(${activeAccent.r}, ${activeAccent.g}, ${activeAccent.b}, 0.15)` }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{
                background: activeAccent.hex,
                boxShadow:  `0 0 6px rgba(${activeAccent.r}, ${activeAccent.g}, ${activeAccent.b}, 0.7)`,
              }}
            />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{activeAccent.label}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{activeAccent.hex}</p>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {/* ── Font family section ── */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--muted-foreground)' }}>
          Police d'écriture
        </p>
        <p className="text-[11px] mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Appliquée à l'ensemble de l'interface.
        </p>

        {FONT_CATEGORIES.map(category => (
          <div key={category} className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
              {category}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FONT_FAMILIES.filter(f => f.category === category).map(font => {
                const isActive = fontId === font.id
                return (
                  <button
                    key={font.id}
                    onClick={() => setFont(font.id)}
                    className="flex flex-col items-start gap-1 p-3 rounded-lg transition-all relative overflow-hidden"
                    style={{
                      background:   isActive ? 'var(--neon-dim)' : 'var(--muted)',
                      border:       isActive ? '1.5px solid var(--neon)' : '1.5px solid var(--border)',
                      borderRadius: '10px',
                      cursor:       'pointer',
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--neon)', boxShadow: '0 0 5px var(--neon)' }}
                      />
                    )}
                    <span
                      className="text-2xl leading-none font-literal"
                      style={{ color: isActive ? 'var(--neon)' : 'var(--foreground)', ['--literal-font' as any]: font.stack }}
                    >
                      {font.preview}
                    </span>
                    <span
                      className="text-[10px] font-medium leading-tight mt-0.5 truncate w-full font-literal"
                      style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)', ['--literal-font' as any]: font.stack }}
                    >
                      {font.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Active font info */}
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-full"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold font-literal"
            style={{ background: 'var(--neon-mid)', color: 'var(--neon)', ['--literal-font' as any]: activeFont.stack }}
          >
            Aa
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{activeFont.label}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{activeFont.stack}</p>
          </div>
        </div>
      </div>
    </div>
  )
}