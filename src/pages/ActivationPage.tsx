import { useState } from 'react'
import { ShieldCheck, Clock, KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

type Screen = 'choice' | 'activate'

interface Props {
  onActivated: () => void
}

export default function ActivationPage({ onActivated }: Props) {
  const [screen, setScreen]   = useState<Screen>('choice')
  const [key, setKey]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // ── Format key as user types: PLAY-XXXX-XXXX-XXXX
  const handleKeyInput = (raw: string) => {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
    const parts = clean.match(/.{1,4}/g) ?? []
    setKey(parts.join('-'))
    setError('')
  }

  // ── Start 7-day trial
  const handleTrial = async () => {
    setLoading(true)
    try {
      const res = await window.playdesk.license.startTrial()
      if (res.success) {
        onActivated()
      } else {
        setError(res.error ?? 'Erreur inconnue')
      }
    } catch {
      setError('Impossible de démarrer l\'essai')
    }
    setLoading(false)
  }

  // ── Activate with serial key
  const handleActivate = async () => {
    if (key.length < 19) {
      setError('Veuillez entrer une clé complète')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await window.playdesk.license.activate(key)
      if (res.success) {
        onActivated()
      } else {
        setError(res.error ?? 'Clé invalide')
      }
    } catch {
      setError('Erreur lors de l\'activation')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0d0f1c' }}>

      {/* ── CHOICE SCREEN ────────────────────────────────────────── */}
      {screen === 'choice' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md px-6">

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-widest mb-1">
              <span className="text-white">PLAY</span>
              <span style={{ color: '#7F77DD' }}>DESK</span>
            </h1>
            <p className="text-sm tracking-widest" style={{ color: '#888780' }}>
              GESTION DE SALLE DE JEUX
            </p>
          </div>

          <p className="text-center text-sm" style={{ color: '#888780' }}>
            Bienvenue ! Choisissez comment vous souhaitez démarrer.
          </p>

          {/* Cards */}
          <div className="flex flex-col gap-3 w-full">

            {/* Trial card */}
            <button
              onClick={handleTrial}
              disabled={loading}
              className="w-full rounded-xl p-5 text-left transition-all group"
              style={{
                background: 'rgba(127,119,221,0.08)',
                border: '1px solid rgba(127,119,221,0.25)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(127,119,221,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(127,119,221,0.25)')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(127,119,221,0.15)' }}>
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7F77DD' }} />
                    : <Clock className="w-5 h-5" style={{ color: '#7F77DD' }} />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-white">Essai gratuit — 7 jours</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888780' }}>
                    Accès complet sans engagement, aucune carte requise
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#7F77DD' }} />
              </div>
            </button>

            {/* Activate card */}
            <button
              onClick={() => { setScreen('activate'); setError('') }}
              className="w-full rounded-xl p-5 text-left transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <KeyRound className="w-5 h-5" style={{ color: '#B4B2A9' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-white">J'ai une clé de série</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888780' }}>
                    Activer avec votre clé PLAY-XXXX-XXXX-XXXX
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#B4B2A9' }} />
              </div>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVATION SCREEN ────────────────────────────────────── */}
      {screen === 'activate' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md px-6">

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-widest mb-1">
              <span className="text-white">PLAY</span>
              <span style={{ color: '#7F77DD' }}>DESK</span>
            </h1>
            <p className="text-sm tracking-widest" style={{ color: '#888780' }}>
              ACTIVATION DE LICENCE
            </p>
          </div>

          <div className="w-full rounded-xl p-6 flex flex-col gap-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(127,119,221,0.15)' }}>
                <ShieldCheck className="w-5 h-5" style={{ color: '#7F77DD' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Entrez votre clé de série</p>
                <p className="text-xs" style={{ color: '#888780' }}>Format : PLAY-XXXX-XXXX-XXXX</p>
              </div>
            </div>

            {/* Key input */}
            <input
              type="text"
              value={key}
              onChange={e => handleKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              placeholder="PLAY-XXXX-XXXX-XXXX"
              maxLength={19}
              spellCheck={false}
              className="w-full rounded-lg px-4 py-3 text-center font-mono text-base outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(127,119,221,0.3)',
                color: '#fff',
                letterSpacing: '0.1em',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(127,119,221,0.7)' }}
              onBlur={e  => { if (!error) e.target.style.borderColor = 'rgba(127,119,221,0.3)' }}
            />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setScreen('choice'); setKey(''); setError('') }}
                className="flex-1 rounded-lg py-2.5 text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#888780', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Retour
              </button>
              <button
                onClick={handleActivate}
                disabled={loading || key.length < 19}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: loading || key.length < 19 ? 'rgba(127,119,221,0.3)' : '#7F77DD',
                  color: '#fff',
                  cursor: loading || key.length < 19 ? 'not-allowed' : 'pointer',
                }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
                  : <><ShieldCheck className="w-4 h-4" /> Activer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}