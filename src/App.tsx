import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useLicenseStore } from './store/licenseStore'
import ActivationPage from './pages/ActivationPage'
import LoginPage from './pages/LoginPage'
import CaissePage from './pages/CaissePage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'

export type Page = 'caisse' | 'dashboard' | 'settings'

export default function App() {
  const { user } = useAuthStore()
  const { activated, setActivated } = useLicenseStore()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<Page>('caisse')

  useEffect(() => {
    const init = async () => {
      try {
        const s = await window.playdesk.license.status()
        setActivated(s.activated)
      } catch {
        setActivated(false)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div className="h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-brand-400 text-xl font-semibold animate-pulse">Chargement...</div>
    </div>
  )

  // Step 1: must be activated
  if (!activated) return <ActivationPage />

  // Step 2: must be logged in
  if (!user) return <LoginPage />

  // Step 3: main app
  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar page={page} setPage={setPage} userRole={user.role} />
        <main className="flex-1 overflow-auto">
          {page === 'caisse'    && <CaissePage />}
          {page === 'dashboard' && user.role === 'admin' && <DashboardPage />}
          {page === 'settings'  && user.role === 'admin' && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}