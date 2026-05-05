import { useEffect, useState } from 'react'
import {
  ShieldCheck, ShieldOff, Clock, AlertTriangle,
  Code2, KeyRound, Loader2, AlertCircle, CalendarClock, CalendarDays,
} from 'lucide-react'

type LicenseStatus = {
  activated:              boolean
  activatedAt?:           string
  subscriptionExpiresAt?: string
  subscriptionExpired?:   boolean
  trial?:                 boolean
  expired?:               boolean
  trialEndsAt?:           number
  daysLeft?:              number
}

function ExpiryCountdown({ expiresAt, daysLeft }: { expiresAt: string; daysLeft: number }) {
  const urgent  = daysLeft <= 7
  const warning = daysLeft <= 30

  return (
    <div className={`rounded-xl px-4 py-3 flex flex-col gap-2 border ${
      urgent  ? 'bg-red-500/5 border-red-500/20' :
      warning ? 'bg-orange-400/5 border-orange-400/20' :
                'bg-green-500/5 border-green-500/15'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className={`w-3.5 h-3.5 ${urgent ? 'text-red-400' : warning ? 'text-orange-400' : 'text-green-400'}`} />
          <span className="text-xs font-medium text-foreground">Abonnement</span>
        </div>
        <span className={`font-mono text-xs font-bold ${urgent ? 'text-red-400' : warning ? 'text-orange-400' : 'text-green-400'}`}>
          {daysLeft === 0 ? 'Expire aujourd\'hui' : `${daysLeft}j restants`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/7 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            urgent  ? 'bg-gradient-to-r from-red-500 to-red-400' :
            warning ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                      'bg-gradient-to-r from-green-500 to-green-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(2, (daysLeft / 365) * 100))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Expire le {new Date(expiresAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        {urgent && (
          <span className="text-red-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Renouvellement urgent
          </span>
        )}
      </div>
    </div>
  )
}

export default function LicenseSettings() {
  const [status, setStatus]   = useState<LicenseStatus | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [key, setKey]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    window.playdesk.license.status()
      .then(s => setStatus(s as LicenseStatus))
      .catch(() => setStatus({ activated: true }))
  }, [success])

  const handleKeyInput = (raw: string) => {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
    setKey((clean.match(/.{1,4}/g) ?? []).join('-'))
    setError('')
  }

  const handleActivate = async () => {
    if (key.length < 19) { setError('Clé incomplète'); return }
    setLoading(true)
    setError('')
    try {
      const res = await window.playdesk.license.activate(key)
      if (res.success) { setSuccess(true); setShowKey(false); setKey('') }
      else setError(res.error ?? 'Clé invalide')
    } catch {
      setError('Erreur lors de l\'activation')
    }
    setLoading(false)
  }

  const computeTrialTimeLeft = () => {
    if (!status?.trialEndsAt) return { days: 0, hours: 0 }
    const ms = status.trialEndsAt - Date.now()
    return {
      days:  Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    }
  }

  const { days, hours } = computeTrialTimeLeft()
  const trialUrgent = status?.trial && !status.expired && days <= 2

  const isActivated          = status?.activated === true
  const isSubscriptionValid   = isActivated && !status?.subscriptionExpired
  const isSubscriptionExpired = isActivated && status?.subscriptionExpired === true
  const isTrialActive         = !isActivated && status?.trial && !status.expired
  const isTrialExpired        = !isActivated && status?.trial && status.expired

  const statusLabel = isSubscriptionValid    ? 'Licence active'
    : isSubscriptionExpired                  ? 'Abonnement expiré'
    : isTrialActive                          ? 'Version d\'essai'
    : isTrialExpired                         ? 'Essai expiré'
    : 'Non activé'

  const statusSub = isSubscriptionValid && status?.subscriptionExpiresAt
    ? `Expire le ${new Date(status.subscriptionExpiresAt).toLocaleDateString('fr-MA')}`
    : isSubscriptionExpired && status?.subscriptionExpiresAt
    ? `Expiré le ${new Date(status.subscriptionExpiresAt).toLocaleDateString('fr-MA')}`
    : isTrialActive   ? `${days}j ${hours}h restants`
    : isTrialExpired  ? 'Votre période d\'essai est terminée'
    : 'Aucune licence détectée'

  const StatusIcon = isSubscriptionValid ? ShieldCheck : isTrialActive ? Clock : ShieldOff

  const iconWrapClass = isSubscriptionValid    ? 'bg-green-400/10'
    : isSubscriptionExpired                    ? 'bg-orange-400/10'
    : isTrialActive                            ? 'bg-yellow-400/10'
    : 'bg-red-400/10'

  const iconClass = isSubscriptionValid    ? 'text-green-400'
    : isSubscriptionExpired                ? 'text-orange-400'
    : isTrialActive                        ? 'text-yellow-400'
    : 'text-red-400'

  const dotClass = isSubscriptionValid    ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
    : isSubscriptionExpired               ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]'
    : isTrialActive                       ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
    : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]'

  const canActivate = !isSubscriptionValid

  return (
    <div className="w-full flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Informations sur votre licence PlayDesk.
      </p>

      <div className="rounded-xl p-5 flex flex-col gap-4 bg-card border border-border">

        {/* Status row */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconWrapClass}`}>
            <StatusIcon className={`w-5 h-5 ${iconClass}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">{statusLabel}</h4>
            <p className="text-xs text-muted-foreground">{statusSub}</p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
        </div>

        <div className="h-px bg-border" />

        {/* ── Subscription expiry countdown ── */}
        {isSubscriptionValid && status?.subscriptionExpiresAt && (
          <ExpiryCountdown
            expiresAt={status.subscriptionExpiresAt}
            daysLeft={status.daysLeft ?? 0}
          />
        )}

        {/* Subscription expired banner */}
        {isSubscriptionExpired && (
          <div className="rounded-lg px-4 py-3 flex items-start gap-3 bg-orange-400/8 border border-orange-400/20">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
            <div>
              <p className="text-sm font-medium text-orange-400">Abonnement expiré</p>
              <p className="text-xs mt-0.5 text-orange-400/70">
                Renouvelez votre licence avec une nouvelle clé PLAY-XXXX-XXXX-XXXX.
              </p>
            </div>
          </div>
        )}

        {/* Trial countdown bar */}
        {isTrialActive && status?.trialEndsAt && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Période d'essai</span>
              <span className={`font-medium ${trialUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
                {days}j {hours}h restants
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/7 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${trialUrgent ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-indigo-400 to-yellow-400'}`}
                style={{ width: `${Math.max(2, (days / 7) * 100)}%` }}
              />
            </div>
            {trialUrgent && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Activez votre licence avant expiration
              </div>
            )}
          </div>
        )}

        {/* Trial expired banner */}
        {isTrialExpired && (
          <div className="rounded-lg px-4 py-3 flex items-start gap-3 bg-red-500/8 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Essai terminé</p>
              <p className="text-xs mt-0.5 text-red-400/70">
                Entrez une clé de série pour continuer à utiliser PlayDesk.
              </p>
            </div>
          </div>
        )}

        {/* Activated at */}
        {isActivated && status?.activatedAt && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Activé le</span>
            </div>
            <span className="font-medium text-foreground">
              {new Date(status.activatedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Activate / Renew */}
        {canActivate && (
          <button
            onClick={() => { setShowKey(v => !v); setError(''); setKey('') }}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 hover:bg-indigo-500/25 transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {showKey ? 'Masquer' : isSubscriptionExpired ? 'Renouveler l\'abonnement' : 'Activer avec une clé de série'}
          </button>
        )}

        {isSubscriptionValid && (
          <button
            onClick={() => { setShowKey(v => !v); setError(''); setKey('') }}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {showKey ? 'Masquer' : 'Renouveler avec une nouvelle clé'}
          </button>
        )}

        {/* Inline key input */}
        {showKey && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={key}
              onChange={e => handleKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              placeholder="PLAY-XXXX-XXXX-XXXX"
              maxLength={19}
              spellCheck={false}
              autoFocus
              className={`w-full rounded-lg px-4 py-2.5 text-center font-mono text-sm outline-none transition-all bg-black/20 text-foreground tracking-[0.08em] border ${error ? 'border-red-500' : 'border-indigo-500/30 focus:border-indigo-500/70'}`}
            />
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            <button
              onClick={handleActivate}
              disabled={loading || key.length < 19}
              className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</>
                : <><ShieldCheck className="w-4 h-4" /> Confirmer l'activation</>
              }
            </button>
          </div>
        )}

        {/* Dev mode banner */}
        {(status as any)?.dev && (
          <div className="rounded-lg px-4 py-3 flex items-start gap-3 bg-yellow-400/8 border border-yellow-400/20">
            <Code2 className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Mode développement</p>
              <p className="text-xs mt-0.5 text-yellow-400/60">La vérification de licence est désactivée</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">PlayDesk v1.0.1 · SQLite local · Hors ligne</p>
        </div>
      </div>
    </div>
  )
}