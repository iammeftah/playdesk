import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, LayoutDashboard, Settings, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page } from '../../App'
import { useAuthStore } from '../../store/authStore'
import { getDefaultAvatar } from '@/lib/defaultAvatar'

interface Props { page: Page; setPage: (p: Page) => void; userRole: string }

const NAV_ITEMS = [
  { id: 'caisse'    as Page, label: 'Caisse',     icon: Monitor,         roles: ['admin', 'manager'] },
  { id: 'dashboard' as Page, label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin'] },
  { id: 'settings'  as Page, label: 'Paramètres', icon: Settings,        roles: ['admin'] },
]

export default function Sidebar({ page, setPage, userRole }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()
  // Init lazily so --neon is already applied by initAccent()
  const [avatar, setAvatar] = useState<string>(() => getDefaultAvatar())
  // Track whether the user has a real custom avatar (don't override on accent change)
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false)

  const items = NAV_ITEMS.filter(i => i.roles.includes(userRole))

  useEffect(() => {
    if (!user?.id) return
    window.playdesk.users.getAvatar(user.id).then(res => {
      if (res.avatar) {
        setAvatar(res.avatar)
        setHasCustomAvatar(true)
      }
    })
  }, [user?.id])

  // Custom avatar uploaded by user
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setAvatar(e.detail)
      setHasCustomAvatar(true)
    }
    window.addEventListener('playdesk:avatar-updated', handler as EventListener)
    return () => window.removeEventListener('playdesk:avatar-updated', handler as EventListener)
  }, [])

  // Regenerate default avatar when accent color changes
  useEffect(() => {
    if (hasCustomAvatar) return
    const handler = () => setAvatar(getDefaultAvatar())
    window.addEventListener('playdesk:accent-updated', handler)
    return () => window.removeEventListener('playdesk:accent-updated', handler)
  }, [hasCustomAvatar])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        background:  'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── TOP: PanelLeft toggle ────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center shrink-0 px-3 pt-3 pb-3',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[9px] font-semibold uppercase tracking-[0.25em] whitespace-nowrap overflow-hidden pl-1"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Navigation
            </motion.span>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 shrink-0"
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
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── NAV ITEMS ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-2 flex-1 min-h-0">
        {items.map((item) => {
          const Icon   = item.icon
          const active = page === item.id
          return (
            <NavBtn
              key={item.id}
              active={active}
              collapsed={collapsed}
              label={item.label}
              onClick={() => setPage(item.id)}
            >
              <Icon className="w-4 h-4 shrink-0" />
            </NavBtn>
          )
        })}
      </div>

      {/* ── PROFILE SECTION ──────────────────────────────────────────────── */}
      <div className="px-2 pb-3 shrink-0">
        <div className="h-px mb-2 mx-1" style={{ background: 'var(--sidebar-border)' }} />
        <ProfileNavBtn
          active={page === ('profile' as Page)}
          collapsed={collapsed}
          username={user?.username ?? ''}
          role={user?.role ?? ''}
          avatar={avatar}
          onClick={() => setPage('profile' as Page)}
        />
      </div>
    </motion.aside>
  )
}

// ── Generic nav button ────────────────────────────────────────────────────────
function NavBtn({
  active, collapsed, label, onClick, children,
}: {
  active:    boolean
  collapsed: boolean
  label:     string
  onClick:   () => void
  children:  React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      title={collapsed ? label : undefined}
      className={cn(
        'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium w-full transition-colors duration-150',
        collapsed ? 'justify-center' : 'justify-start',
      )}
      style={{
        color:      active ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)',
        background: active ? 'var(--sidebar-accent)'     : 'transparent',
        outline:    'none',
        boxShadow:  'none',
      }}
      onFocus={e  => { e.currentTarget.style.boxShadow = 'none' }}
      onBlur={e   => { e.currentTarget.style.boxShadow = 'none' }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color      = 'var(--sidebar-foreground)'
          e.currentTarget.style.background = 'var(--sidebar-accent)'
        }
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color      = 'var(--muted-foreground)'
          e.currentTarget.style.background = 'transparent'
        }
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {active && (
        <motion.span
          layoutId="sidebar-pill"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full"
          style={{ background: 'var(--neon)', boxShadow: '0 0 8px var(--neon)' }}
        />
      )}
      {children}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="tracking-wide text-[13px] whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ── Profile nav button ────────────────────────────────────────────────────────
function ProfileNavBtn({
  active, collapsed, username, role, avatar, onClick,
}: {
  active:    boolean
  collapsed: boolean
  username:  string
  role:      string
  avatar:    string
  onClick:   () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      title={collapsed ? `${username} — Profil` : undefined}
      className={cn(
        'relative flex items-center gap-2.5 rounded-xl w-full transition-colors duration-150',
        collapsed ? 'justify-center p-1.5' : 'justify-start px-2 py-2',
      )}
      style={{
        background: active ? 'var(--sidebar-accent)' : 'transparent',
        outline:    'none',
        boxShadow:  'none',
      }}
      onFocus={e  => { e.currentTarget.style.boxShadow = 'none' }}
      onBlur={e   => { e.currentTarget.style.boxShadow = 'none' }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--sidebar-accent)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {active && (
        <motion.span
          layoutId="sidebar-pill-profile"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full"
          style={{ background: 'var(--neon)', boxShadow: '0 0 8px var(--neon)' }}
        />
      )}

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-lg overflow-hidden shrink-0 transition-all duration-200"
        style={{
          boxShadow: active
            ? '0 0 0 1.5px var(--neon), 0 0 8px var(--neon-glow)'
            : '0 0 0 1px var(--border)',
        }}
      >
        <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start overflow-hidden min-w-0"
          >
            <span
              className="text-[13px] font-medium tracking-wide whitespace-nowrap leading-tight"
              style={{ color: active ? 'var(--sidebar-foreground)' : 'var(--foreground)' }}
            >
              {username}
            </span>
            <span
              className="text-[9px] uppercase tracking-widest whitespace-nowrap leading-tight mt-0.5"
              style={{ color: 'var(--neon)' }}
            >
              {role}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}