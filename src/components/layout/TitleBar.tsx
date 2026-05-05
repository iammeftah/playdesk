import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Maximize2, Minimize2, X, Gamepad2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function TitleBar() {
  const { user, logout }      = useAuthStore()
  const [maximized, setMaximized] = useState(false)

  // Track maximize state by listening to window resize
  useEffect(() => {
    const check = () => {
      setMaximized(
        window.innerWidth  === screen.availWidth &&
        window.innerHeight === screen.availHeight
      )
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLogout = async () => {
    try { await window.playdesk.auth.logout() } catch {}
    logout()
  }

  const handleMaximize = () => {
    window.playdesk.window.maximize()
    // Optimistic toggle — resize event will correct if wrong
    setMaximized(v => !v)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="titlebar-drag h-10 border-b flex items-center px-3 gap-3 select-none shrink-0 relative z-50"
      style={{
        background:          'var(--titlebar-bg)',
        borderColor:         'var(--titlebar-border)',
        backdropFilter:      'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <Gamepad2 className="w-3 h-3" style={{ color: 'var(--foreground)', opacity: 0.6 }} />
        </div>
        <span className="font-bold text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
          Play<span style={{ color: 'var(--neon)' }}>Desk</span>
        </span>
      </div>

      {/* Draggable spacer */}
      <div className="titlebar-drag-region flex-1 h-full" />

      {/* Logged-in user */}
      {user && (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <span className="text-[9px] font-bold" style={{ color: 'var(--muted-foreground)' }}>
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div className="leading-none">
              <p className="text-[11px] font-medium" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                {user.username}
              </p>
              <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--neon)' }}>
                {user.role}
              </p>
            </div>
          </div>
          <div className="w-px h-3.5" style={{ background: 'var(--border)' }} />
          <button
            onClick={handleLogout}
            className="text-[10px] px-2 py-1 rounded-md tracking-wide transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.background = 'var(--muted)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'transparent' }}
          >
            Déconnexion
          </button>
        </div>
      )}

      {/* Window controls — minimize / maximize / close */}
      <div className="flex gap-0.5 ml-1">
        <WinBtn
          onClick={() => window.playdesk.window.minimize()}
          hoverBg="var(--muted)"
          hoverColor="var(--foreground)"
          label="Réduire"
        >
          <Minus className="w-3 h-3" />
        </WinBtn>

        <WinBtn
          onClick={handleMaximize}
          hoverBg="var(--muted)"
          hoverColor="var(--foreground)"
          label={maximized ? 'Restaurer' : 'Agrandir'}
        >
          {maximized
            ? <Minimize2 className="w-3 h-3" />
            : <Maximize2 className="w-3 h-3" />
          }
        </WinBtn>

        <WinBtn
          onClick={() => window.playdesk.window.close()}
          hoverBg="rgba(239,68,68,0.75)"
          hoverColor="#fff"
          label="Fermer"
        >
          <X className="w-3 h-3" />
        </WinBtn>
      </div>
    </motion.div>
  )
}

function WinBtn({
  onClick, children, hoverBg, hoverColor, label,
}: {
  onClick:     () => void
  children:    React.ReactNode
  hoverBg:     string
  hoverColor:  string
  label?:      string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
      style={{ color: 'var(--muted-foreground)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = hoverBg
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--muted-foreground)'
      }}
    >
      {children}
    </button>
  )
}