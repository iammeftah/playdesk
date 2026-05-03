import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export default function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('playdesk_theme') as Theme) ?? 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('playdesk_theme', theme)
  }, [theme])

  // Listen to system changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const options: { value: Theme; label: string; desc: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Clair',
      desc: 'Interface lumineuse sur fond blanc',
      icon: <Sun className="w-4 h-4" />,
      preview: (
        <div className="w-full h-16 rounded-md overflow-hidden flex flex-col" style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}>
          {/* Fake titlebar */}
          <div className="h-4 flex items-center px-2 gap-1.5" style={{ background: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
            <div className="w-8 h-1.5 rounded-full" style={{ background: '#0a0a0a', opacity: 0.15 }} />
          </div>
          <div className="flex flex-1">
            <div className="w-8 h-full" style={{ background: '#ffffff', borderRight: '1px solid #e5e5e5' }} />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <div className="h-1.5 w-3/4 rounded" style={{ background: '#e5e5e5' }} />
              <div className="h-1.5 w-1/2 rounded" style={{ background: '#e5e5e5' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'dark',
      label: 'Sombre',
      desc: 'Interface sombre sur fond noir',
      icon: <Moon className="w-4 h-4" />,
      preview: (
        <div className="w-full h-16 rounded-md overflow-hidden flex flex-col" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
          <div className="h-4 flex items-center px-2 gap-1.5" style={{ background: '#141414', borderBottom: '1px solid #1e1e1e' }}>
            <div className="w-8 h-1.5 rounded-full" style={{ background: '#fafafa', opacity: 0.15 }} />
          </div>
          <div className="flex flex-1">
            <div className="w-8 h-full" style={{ background: '#0e0e0e', borderRight: '1px solid #1e1e1e' }} />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <div className="h-1.5 w-3/4 rounded" style={{ background: '#2a2a2a' }} />
              <div className="h-1.5 w-1/2 rounded" style={{ background: '#2a2a2a' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'system',
      label: 'Système',
      desc: 'Suit les préférences de l\'OS',
      icon: <Monitor className="w-4 h-4" />,
      preview: (
        <div className="w-full h-16 rounded-md overflow-hidden flex" style={{ border: '1px solid var(--border)' }}>
          {/* Half light / half dark */}
          <div className="flex-1 flex flex-col" style={{ background: '#fafafa' }}>
            <div className="h-4" style={{ background: '#ffffff', borderBottom: '1px solid #e5e5e5' }} />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <div className="h-1.5 w-3/4 rounded" style={{ background: '#e5e5e5' }} />
            </div>
          </div>
          <div className="flex-1 flex flex-col" style={{ background: '#0a0a0a' }}>
            <div className="h-4" style={{ background: '#141414', borderBottom: '1px solid #1e1e1e' }} />
            <div className="flex-1 p-1.5 flex flex-col gap-1">
              <div className="h-1.5 w-3/4 rounded" style={{ background: '#2a2a2a' }} />
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="w-full">
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Choisissez l'apparence de l'interface. Le mode système suit automatiquement les préférences de votre OS.
      </p>

      {/* Theme selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {options.map(opt => {
          const active = theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="theme-option p-3 flex flex-col gap-2.5 text-left relative"
              style={{
                border: '2px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Active dot — top-right corner */}
              {active && (
                <span
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                  style={{
                    background: 'var(--neon)',
                    boxShadow: '0 0 6px var(--neon), 0 0 12px var(--neon)',
                  }}
                />
              )}

              {opt.preview}

              <div className="flex items-center gap-2">
                <span style={{ color: active ? 'var(--neon)' : 'var(--muted-foreground)' }}>
                  {opt.icon}
                </span>
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {opt.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Current mode info */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 w-full"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--neon-mid)', color: 'var(--neon)' }}
        >
          {options.find(o => o.value === theme)?.icon}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            Mode {options.find(o => o.value === theme)?.label}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {options.find(o => o.value === theme)?.desc}
          </p>
        </div>
      </div>
    </div>
  )
}