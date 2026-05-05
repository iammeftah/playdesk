import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useShiftStore } from '../../store/useShiftStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="10" fill="#1e2035"/>
    <circle cx="20" cy="15" r="7" fill="#3d4068"/>
    <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#3d4068"/>
  </svg>`
)}`

export default function TitleBar() {
  const { user, logout }               = useAuthStore()
  const { activeShift }                = useShiftStore()
  const [maximized, setMaximized]      = useState(false)
  const [closeGuard, setCloseGuard]    = useState(false)
  const [closingShift, setClosingShift] = useState(false)
  const [groupHovered, setGroupHovered] = useState(false)

  // ── Avatar state ──────────────────────────────────────────────────────────
  const [titlebarAvatar, setTitlebarAvatar] = useState<string>(DEFAULT_AVATAR)

  // Load avatar on mount
  useEffect(() => {
    if (!user?.id) return
    window.playdesk.users.getAvatar(user.id).then(res => {
      setTitlebarAvatar(res.avatar ?? DEFAULT_AVATAR)
    })
  }, [user?.id])

  // Listen for avatar updates from ProfilePage
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      setTitlebarAvatar(detail || DEFAULT_AVATAR)
    }
    window.addEventListener('playdesk:avatar-updated', handler)
    return () => window.removeEventListener('playdesk:avatar-updated', handler)
  }, [])

  useEffect(() => {
    const check = () => {
      setMaximized(
        window.innerWidth  === screen.availWidth &&
        window.innerHeight === screen.availHeight,
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

  const handleCloseAndExit = async () => {
    if (!activeShift || !user) { window.playdesk.window.close(); return }
    try {
      setClosingShift(true)
      await window.playdesk.shifts.close(user.id)
    } catch {}
    window.playdesk.window.close()
  }

  const handleClose = () => {
    if (activeShift && (activeShift.status === 'open' || activeShift.status === 'paused')) {
      setCloseGuard(true)
    } else {
      window.playdesk.window.close()
    }
  }

  const handleMaximize = () => {
    window.playdesk.window.maximize()
    setMaximized(v => !v)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="titlebar-drag h-10 border-b flex items-center px-3 gap-3 select-none shrink-0 relative z-50"
        style={{
          background:           'var(--titlebar-bg)',
          borderColor:          'var(--titlebar-border)',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* ── macOS traffic-light buttons ── */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onMouseEnter={() => setGroupHovered(true)}
          onMouseLeave={() => setGroupHovered(false)}
        >
          {/* Red — close */}
          <TrafficBtn
            onClick={handleClose}
            baseColor="#ff5f57"
            glowColor="rgba(255,95,87,0.55)"
            hovered={groupHovered}
            label="Fermer"
          >
            <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round">
              <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" />
              <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" />
            </svg>
          </TrafficBtn>

          {/* Yellow — minimize */}
          <TrafficBtn
            onClick={() => window.playdesk.window.minimize()}
            baseColor="#febc2e"
            glowColor="rgba(254,188,46,0.55)"
            hovered={groupHovered}
            label="Réduire"
          >
            <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none" stroke="#4d3300" strokeWidth="1.2" strokeLinecap="round">
              <line x1="1.5" y1="4" x2="6.5" y2="4" />
            </svg>
          </TrafficBtn>

          {/* Green — maximize */}
          <TrafficBtn
            onClick={handleMaximize}
            baseColor="#28c840"
            glowColor="rgba(40,200,64,0.55)"
            hovered={groupHovered}
            label={maximized ? 'Restaurer' : 'Agrandir'}
          >
            {maximized ? (
              <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none" stroke="#003d00" strokeWidth="1.2" strokeLinecap="round">
                <line x1="2" y1="2" x2="6" y2="6" />
                <polyline points="6,3 6,6 3,6" />
              </svg>
            ) : (
              <svg viewBox="0 0 8 8" className="w-1.5 h-1.5" fill="none" stroke="#003d00" strokeWidth="1.2" strokeLinecap="round">
                <line x1="2" y1="6" x2="6" y2="2" />
                <polyline points="2,3 2,6 5,6" />
              </svg>
            )}
          </TrafficBtn>
        </div>

        {/* ── Brand ── */}
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-xs tracking-[0.2em] uppercase"
            style={{ color: 'var(--foreground)', opacity: 0.8 }}
          >
            Play<span style={{ color: 'var(--neon)' }}>Desk</span>
          </span>
        </div>

        {/* ── Draggable spacer ── */}
        <div className="titlebar-drag-region flex-1 h-full" />

        {/* ── Logged-in user (with avatar) ── */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              {/* Avatar image instead of letter */}
              <div
                className="w-5 h-5 rounded-md overflow-hidden shrink-0"
                style={{ border: '1px solid var(--border)' }}
              >
                <img
                  src={titlebarAvatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
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
              onMouseEnter={e => {
                e.currentTarget.style.color      = 'var(--foreground)'
                e.currentTarget.style.background = 'var(--muted)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color      = 'var(--muted-foreground)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Close guard modal ── */}
      <Dialog
        open={closeGuard}
        onOpenChange={open => { if (!open && !closingShift) setCloseGuard(false) }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <DialogTitle>Shift encore ouvert</DialogTitle>
            </div>
            <DialogDescription>
              Vous avez un shift{' '}
              <span className="font-medium text-foreground">
                {activeShift?.status === 'paused' ? 'en pause' : 'en cours'}
              </span>{' '}
              non clôturé. En fermant l'application, le shift sera automatiquement clôturé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCloseGuard(false)} disabled={closingShift}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleCloseAndExit} disabled={closingShift}>
              {closingShift ? 'Clôture en cours...' : 'Clôturer et fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Traffic light button ──────────────────────────────────────────────────────
function TrafficBtn({
  onClick, baseColor, glowColor, hovered, label, children,
}: {
  onClick:    () => void
  baseColor:  string
  glowColor:  string
  hovered:    boolean
  label?:     string
  children:   React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 cursor-default"
      style={{
        background: baseColor,
        boxShadow:  hovered ? `0 0 5px ${glowColor}` : 'none',
      }}
    >
      <span
        className="transition-opacity duration-100 flex items-center justify-center"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        {children}
      </span>
    </button>
  )
}