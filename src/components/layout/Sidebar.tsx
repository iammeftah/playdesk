import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page } from '../../App'

interface Props { page: Page; setPage: (p: Page) => void; userRole: string }

const NAV_ITEMS = [
  { id: 'caisse'    as Page, label: 'Caisse',     icon: Monitor,         roles: ['admin', 'manager'] },
  { id: 'dashboard' as Page, label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin'] },
  { id: 'settings'  as Page, label: 'Paramètres', icon: Settings,        roles: ['admin'] },
]

export default function Sidebar({ page, setPage, userRole }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const items = NAV_ITEMS.filter(i => i.roles.includes(userRole))

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 216 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        background:  'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── Nav items ── */}
      <div className="flex flex-col flex-1 pt-4 min-h-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[9px] font-semibold uppercase tracking-[0.25em] px-4 mb-3 whitespace-nowrap"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-0.5 px-2">
          {items.map((item) => {
            const Icon   = item.icon
            const active = page === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => setPage(item.id)}
                whileTap={{ scale: 0.97 }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium w-full transition-colors duration-150',
                  collapsed ? 'justify-center' : 'justify-start',
                )}
                style={{
                  color:      active ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)',
                  background: active ? 'var(--sidebar-accent)'     : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color      = 'var(--sidebar-foreground)'
                    e.currentTarget.style.background = 'var(--sidebar-accent)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color      = 'var(--muted-foreground)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full"
                    style={{ background: 'var(--neon)', boxShadow: '0 0 8px var(--neon)' }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="tracking-wide text-[13px] whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom: version badge + collapse toggle side-by-side ── */}
      <div className="p-2 pb-3">
        {collapsed ? (
          /* Collapsed: just the toggle button, centered */
          <div className="flex justify-center">
            <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(c => !c)} />
          </div>
        ) : (
          /* Expanded: badge row with toggle pinned to its right */
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="neon-dot shrink-0" />
                <p className="text-[10px] font-medium tracking-wide truncate" style={{ color: 'var(--muted-foreground)' }}>
                  PlayDesk
                </p>
              </div>
              <p className="text-[10px] tracking-wide" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                v1.0.0 · Activé
              </p>
            </div>
            <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(c => !c)} />
          </div>
        )}
      </div>
    </motion.aside>
  )
}

function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
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
      {collapsed
        ? <ChevronRight className="w-3.5 h-3.5" />
        : <ChevronLeft  className="w-3.5 h-3.5" />
      }
    </button>
  )
}