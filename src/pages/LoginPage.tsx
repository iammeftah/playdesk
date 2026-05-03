import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await window.playdesk.auth.login(username, password)
      if (res.success) setUser(res.user)
      else setError(res.error ?? 'Erreur connexion')
    } catch {
      setError('Erreur système')
    }
    setLoading(false)
  }

  return (
    <div className="h-screen bg-surface-950 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-5xl mb-3">🎮</div>
        <h1 className="text-3xl font-bold text-white">PlayDesk</h1>
        <p className="text-surface-400 mt-2">Connectez-vous pour continuer</p>
      </div>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 w-96 flex flex-col gap-4">
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
          placeholder="Mot de passe" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500" />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={handleLogin} disabled={loading || !username || !password}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="text-surface-500 text-xs text-center">Par défaut: admin / admin123</p>
      </div>
    </div>
  )
}
