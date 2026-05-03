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

  return (
    <div className="w-full">
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Choisissez l'apparence de l'interface. Le mode système suit automatiquement les préférences de votre OS.
      </p>

      {/* Theme selector — equal 3-col, fills full width */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {options.map(opt => {
          const active = theme === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex flex-col gap-2 p-2.5 text-left relative"
              style={{
                background: active ? 'var(--neon-dim)' : 'var(--muted)',
                border: active ? '1.5px solid var(--neon)' : '1.5px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background 0.15s ease',
                boxShadow: active ? '0 0 0 1px var(--neon-dim)' : 'none',
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

      {/* Current mode info */}
      <div
        className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-full"
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
    </div>
  )
}