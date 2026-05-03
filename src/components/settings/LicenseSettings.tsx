import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Clock, AlertTriangle, Code2, KeyRound, Loader2, AlertCircle } from 'lucide-react'

type LicenseStatus = {
  activated:    boolean
  activatedAt?: string
  trial?:       boolean
  expired?:     boolean
  trialEndsAt?: number
  daysLeft?:    number
}

export default function LicenseSettings() {
  const [status, setStatus]   = useState<LicenseStatus | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [key, setKey]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  // Live countdown ticker (updates every minute)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    window.playdesk.license.status()
      .then(setStatus)
      .catch(() => setStatus({ activated: true }))
  }, [success])

  const handleKeyInput = (raw: string) => {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
    const parts  = clean.match(/.{1,4}/g) ?? []
    setKey(parts.join('-'))
    setError('')
  }

  const handleActivate = async () => {
    if (key.length < 19) { setError('Clé incomplète'); return }
    setLoading(true)
    setError('')
    try {
      const res = await window.playdesk.license.activate(key)
      if (res.success) {
        setSuccess(true)
        setShowKey(false)
        setKey('')
      } else {
        setError(res.error ?? 'Clé invalide')
      }
    } catch {
      setError('Erreur lors de l\'activation')
    }
    setLoading(false)
  }

  // ── Compute live days/hours left ──────────────────────────────
  const computeTimeLeft = () => {
    if (!status?.trialEndsAt) return { days: 0, hours: 0 }
    const ms    = status.trialEndsAt - Date.now()
    const days  = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
    const hours = Math.max(0, Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
    return { days, hours }
  }

  const { days, hours } = computeTimeLeft()
  const trialUrgent = status?.trial && !status.expired && days <= 2

  return (
    <div className="w-full flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Informations sur votre licence PlayDesk.
      </p>

      {/* ── Main status card ───────────────────────────────────── */}
      <div className="rounded-xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Status row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: status?.activated
                ? 'rgba(74,222,128,0.1)'
                : status?.trial && !status.expired
                  ? 'rgba(234,179,8,0.1)'
                  : 'rgba(239,68,68,0.1)',
            }}>
            {status?.activated
              ? <ShieldCheck className="w-5 h-5" style={{ color: '#4ade80' }} />
              : status?.trial && !status.expired
                ? <Clock className="w-5 h-5" style={{ color: '#eab308' }} />
                : <ShieldOff className="w-5 h-5" style={{ color: '#ef4444' }} />
            }
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {status?.activated
                ? 'Licence active'
                : status?.trial && !status.expired
                  ? 'Version d\'essai'
                  : status?.expired
                    ? 'Essai expiré'
                    : 'Non activé'}
            </h4>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {status?.activated
                ? 'Toutes les fonctionnalités sont disponibles'
                : status?.trial && !status.expired
                  ? `${days}j ${hours}h restants`
                  : status?.expired
                    ? 'Votre période d\'essai est terminée'
                    : 'Aucune licence détectée'}
            </p>
          </div>

          {/* Status dot */}
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{
            background: status?.activated
              ? '#4ade80'
              : status?.trial && !status.expired
                ? '#eab308'
                : '#ef4444',
            boxShadow: status?.activated
              ? '0 0 8px rgba(74,222,128,0.6)'
              : status?.trial && !status.expired
                ? '0 0 8px rgba(234,179,8,0.6)'
                : '0 0 8px rgba(239,68,68,0.6)',
          }} />
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* ── Trial countdown bar ─────────────────────────────── */}
        {status?.trial && !status.expired && status.trialEndsAt && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span>Période d'essai</span>
              <span style={{ color: trialUrgent ? '#ef4444' : '#eab308', fontWeight: 500 }}>
                {days}j {hours}h restants
              </span>
            </div>
            {/* Progress bar: full = 7 days, depletes over time */}
            <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(2, (days / 7) * 100)}%`,
                  background: trialUrgent
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : 'linear-gradient(90deg, #7F77DD, #eab308)',
                }}
              />
            </div>
            {trialUrgent && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Activez votre licence avant expiration pour ne pas perdre l'accès
              </div>
            )}
          </div>
        )}

        {/* ── Expired banner ──────────────────────────────────── */}
        {status?.expired && (
          <div className="rounded-lg px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Essai terminé</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(239,68,68,0.7)' }}>
                Entrez une clé de série pour continuer à utiliser PlayDesk.
              </p>
            </div>
          </div>
        )}

        {/* ── Activated at ───────────────────────────────────── */}
        {status?.activated && status.activatedAt && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Activé le</span>
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {new Date(status.activatedAt).toLocaleDateString('fr-MA')}
            </span>
          </div>
        )}

        {/* ── Activate button (shown for trial or expired) ────── */}
        {!status?.activated && (
          <button
            onClick={() => { setShowKey(v => !v); setError(''); setKey('') }}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'rgba(127,119,221,0.15)',
              border: '1px solid rgba(127,119,221,0.35)',
              color: '#7F77DD',
            }}
          >
            <KeyRound className="w-4 h-4" />
            {showKey ? 'Masquer' : 'Activer avec une clé de série'}
          </button>
        )}

        {/* ── Inline key input ────────────────────────────────── */}
        {showKey && !status?.activated && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={key}
              onChange={e => handleKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              placeholder="PLAY-XXXX-XXXX-XXXX"
              maxLength={19}
              spellCheck={false}
              className="w-full rounded-lg px-4 py-2.5 text-center font-mono text-sm outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(127,119,221,0.3)',
                color: 'var(--foreground)',
                letterSpacing: '0.08em',
              }}
            />
            {error && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            <button
              onClick={handleActivate}
              disabled={loading || key.length < 19}
              className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading || key.length < 19 ? 'rgba(127,119,221,0.3)' : '#7F77DD',
                color: '#fff',
                cursor: loading || key.length < 19 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
                : <><ShieldCheck className="w-4 h-4" /> Confirmer l'activation</>
              }
            </button>
          </div>
        )}

        {/* ── Dev mode ────────────────────────────────────────── */}
        {(status as any)?.dev && (
          <div className="rounded-lg px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <Code2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#eab308' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#eab308' }}>Mode développement</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(234,179,8,0.6)' }}>
                La vérification de licence est désactivée
              </p>
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            PlayDesk v1.0.1 · SQLite local · Hors ligne
          </p>
        </div>
      </div>
    </div>
  )
}