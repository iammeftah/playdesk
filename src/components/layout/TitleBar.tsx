import { useAuthStore } from '../../store/authStore'

export default function TitleBar() {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await window.playdesk.auth.logout() } catch {}
    logout()
  }

  return (
    <div className="h-10 bg-surface-900 border-b border-surface-800 flex items-center px-4 gap-3 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <span className="text-brand-400 font-bold text-sm tracking-wider">🎮 PLAYDESK</span>
      <div className="flex-1" />
      {user && (
        <span className="text-surface-300 text-xs">
          {user.username} · <span className="text-brand-400 uppercase">{user.role}</span>
        </span>
      )}
      {user && (
        <button onClick={handleLogout}
          className="text-xs text-surface-400 hover:text-white px-2 py-1 rounded"
          style={{ WebkitAppRegion: 'no-drag' } as any}>
          Déconnexion
        </button>
      )}
      <div className="flex gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={() => window.playdesk.window.minimize()} className="w-7 h-7 rounded hover:bg-surface-800 text-surface-400 hover:text-white text-sm flex items-center justify-center">─</button>
        <button onClick={() => window.playdesk.window.maximize()} className="w-7 h-7 rounded hover:bg-surface-800 text-surface-400 hover:text-white text-sm flex items-center justify-center">□</button>
        <button onClick={() => window.playdesk.window.close()} className="w-7 h-7 rounded hover:bg-red-600 text-surface-400 hover:text-white text-sm flex items-center justify-center">✕</button>
      </div>
    </div>
  )
}
