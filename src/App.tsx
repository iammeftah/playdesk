import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from './components/ui/sonner'
import { useAuthStore }    from './store/authStore'
import { useLicenseStore } from './store/licenseStore'
import ActivationPage from './pages/ActivationPage'
import LoginPage      from './pages/LoginPage'
import CaissePage     from './pages/CaissePage'
import DashboardPage  from './pages/DashboardPage'
import SettingsPage   from './pages/SettingsPage'
import TitleBar       from './components/layout/TitleBar'
import Sidebar        from './components/layout/Sidebar'
import UndoToastContainer from './components/common/undoToast'
import ProfilePage from './pages/ProfilePage'
import { initAccent } from './store/useAccentColor'

export type Page = 'caisse' | 'dashboard' | 'settings' | 'profile'

const pageVariants = {
  initial: { opacity: 0, y: 6  },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -4 },
}

function initTheme() {
  const saved = localStorage.getItem('playdesk_theme') ?? 'dark'
  const root  = document.documentElement
  if (saved === 'dark') {
    root.classList.add('dark')
  } else if (saved === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

// ── Run both inits before React renders ──────────────────────────────────────
initTheme()
initAccent()

export default function App() {
  const { user }       = useAuthStore()
  const { activated, trial, expired, setStatus } = useLicenseStore()
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState<Page>('caisse')

  useEffect(() => {
    const init = async () => {
      try {
        const s = await window.playdesk.license.status()
        setStatus({
          activated:   s.activated,
          trial:       s.trial       ?? false,
          expired:     s.expired     ?? false,
          daysLeft:    s.daysLeft    ?? 0,
          trialEndsAt: s.trialEndsAt ?? undefined,
        })
      } catch {
        setStatus({ activated: true })
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div
      className="h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--neon)' }}
      />
    </div>
  )

  const canUse = activated || (trial && !expired)
  if (!canUse) return (
    <>
      <ActivationPage
        onActivated={() =>
          window.playdesk.license.status().then(s =>
            setStatus({
              activated:   s.activated,
              trial:       s.trial       ?? false,
              expired:     s.expired     ?? false,
              daysLeft:    s.daysLeft    ?? 0,
              trialEndsAt: s.trialEndsAt ?? undefined,
            })
          )
        }
      />
      <Toaster position="bottom-center" richColors theme="dark" />
    </>
  )

  if (!user) return (
    <>
      <LoginPage />
      <Toaster position="bottom-center" richColors theme="dark" />
    </>
  )

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar page={page} setPage={setPage} userRole={user.role} />
        <main className="flex-1 overflow-auto" style={{ background: 'var(--background)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {page === 'caisse'                              && <CaissePage />}
              {page === 'dashboard' && user.role === 'admin'  && <DashboardPage />}
              {page === 'settings'  && user.role === 'admin'  && <SettingsPage />}
              {page === 'profile'  && <ProfilePage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Undo toasts */}
      <UndoToastContainer />

      {/* Global toast renderer — theme-aware */}
      <Toaster
        position="bottom-center"
        richColors
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        className='rounded-xl'
      />
    </div>
  )
}