import { useState } from 'react'
import { useLicenseStore } from '../store/licenseStore'

export default function ActivationPage() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setActivated } = useLicenseStore()

  const handleActivate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await window.playdesk.license.activate(key)
      if (res.success) setActivated(true)
      else setError(res.error ?? 'Erreur activation')
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
        <p className="text-surface-400 mt-2">Entrez votre clé d'activation</p>
      </div>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 w-96 flex flex-col gap-4">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="PLAY-XXXX-XXXX-XXXX"
          className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-white font-mono text-center text-lg tracking-widest outline-none focus:border-brand-500"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={handleActivate} disabled={loading || !key}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors">
          {loading ? 'Activation...' : 'Activer'}
        </button>
      </div>
    </div>
  )
}
