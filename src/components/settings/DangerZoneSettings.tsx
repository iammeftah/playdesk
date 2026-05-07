import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
  Download, Trash2, RefreshCw,
  FileSpreadsheet, Loader2, ShieldAlert, AlertTriangle, Info,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─────────────────────────────────────────────────────────────────────────────

type ActionId = 'exportExcel' | 'clearCache' | 'resetDb'

// ─────────────────────────────────────────────────────────────────────────────

export default function DangerZoneSettings() {
  const { user: currentUser } = useAuthStore()

  const [pending,  setPending]  = useState<ActionId | null>(null)
  const [loading,  setLoading]  = useState<ActionId | null>(null)
  const [toast,    setToast]    = useState<{ id: ActionId; msg: string; ok: boolean } | null>(null)

  // Reset confirmation phrase state
  const [resetPhrase, setResetPhrase] = useState('')
  const resetUsername = currentUser?.username ?? 'admin'
  const EXPECTED_PHRASE = `je suis ${resetUsername} et je veux réinitialiser l'application`

  const showToast = (id: ActionId, msg: string, ok: boolean) => {
    setToast({ id, msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const run = async (id: ActionId) => {
    setLoading(id)
    try {
      switch (id) {
        case 'exportExcel': {
          const res = await (window as any).playdesk.danger.exportExcel()
          if (res.success) showToast(id, `Fichier sauvegardé sur le Bureau → ${res.path.split(/[\\/]/).pop()}`, true)
          else             showToast(id, res.error ?? 'Erreur lors de l\'export', false)
          break
        }
        case 'clearCache': {
          localStorage.clear()
          showToast(id, 'Préférences réinitialisées. Rechargez l\'app pour appliquer.', true)
          break
        }
        case 'resetDb': {
          const res = await (window as any).playdesk.danger.resetDb()
          if (res.success) {
            showToast(id, 'Réinitialisation terminée. Redémarrage en cours…', true)
            setTimeout(() => (window as any).playdesk.danger.relaunch(), 1800)
          } else {
            showToast(id, res.error ?? 'Erreur lors de la réinitialisation', false)
          }
          break
        }
      }
    } catch (e: any) {
      showToast(id, e.message ?? 'Erreur inconnue', false)
    }
    setLoading(null)
  }

  const handleConfirm = async (id: ActionId) => {
    setPending(null)
    setResetPhrase('')
    await run(id)
  }

  const handleOpenDialog = (id: ActionId) => {
    setResetPhrase('')
    setPending(id)
  }

  // ── Layout helpers ──────────────────────────────────────────────────────────

  const btnStyle = (
    color: 'indigo' | 'amber' | 'red',
    isLoading: boolean,
  ) => {
    const base = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
    if (isLoading) return `${base} opacity-60 cursor-not-allowed`
    if (color === 'indigo') return `${base} bg-indigo-500/12 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/22`
    if (color === 'amber')  return `${base} bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/18`
    return `${base} bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/18`
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-3">

      {/* Warning banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
      >
        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(239,68,68,0.85)' }}>
          Exportez toujours vos données <strong>avant</strong> toute réinitialisation. Ces actions ne peuvent pas être annulées.
        </p>
      </div>

      {/* ── Action 1: Export Excel ── */}
      {/* <ActionRow
        icon={<FileSpreadsheet className="w-4 h-4" />}
        iconColor="indigo"
        label="Sauvegarder les données (Excel)"
        desc="Génère un fichier Excel complet sur votre Bureau — Sessions, shifts, alertes, résumé journalier. À faire avant toute réinitialisation."
        toast={toast?.id === 'exportExcel' ? toast : null}
        action={
          <button
            onClick={() => run('exportExcel')}
            disabled={loading === 'exportExcel'}
            className={btnStyle('indigo', loading === 'exportExcel')}
          >
            {loading === 'exportExcel'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours…</>
              : <><Download className="w-3.5 h-3.5" /> Exporter</>
            }
          </button>
        }
      /> */}

      {/* ── Action 2: Clear Cache ── */}
      {/* <ActionRow
        icon={<Trash2 className="w-4 h-4" />}
        iconColor="amber"
        label="Réinitialiser les préférences"
        desc="Remet à zéro uniquement l'apparence et les tarifs configurés localement (thème, couleurs, prix des sessions). Vos sessions, historique et utilisateurs ne sont pas touchés."
        info="Utile si l'application affiche mal ou si vous voulez repartir des réglages par défaut."
        toast={toast?.id === 'clearCache' ? toast : null}
        action={
          <button
            onClick={() => handleOpenDialog('clearCache')}
            disabled={loading === 'clearCache'}
            className={btnStyle('amber', loading === 'clearCache')}
          >
            {loading === 'clearCache'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours…</>
              : <><Trash2 className="w-3.5 h-3.5" /> Réinitialiser</>
            }
          </button>
        }
      /> */}

      {/* ── Action 3: Reset DB ── */}
      <ActionRow
        icon={<RefreshCw className="w-4 h-4" />}
        iconColor="red"
        label="Effacer toutes les données"
        desc="Supprime définitivement tout l'historique : sessions, shifts, stations et comptes utilisateurs. L'application redémarre comme à la première installation."
        info="Votre licence reste active — vous n'aurez pas à réactiver l'application."
        toast={toast?.id === 'resetDb' ? toast : null}
        action={
          <button
            onClick={() => handleOpenDialog('resetDb')}
            disabled={loading === 'resetDb'}
            className={btnStyle('red', loading === 'resetDb')}
          >
            {loading === 'resetDb'
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Effacer</>
            }
          </button>
        }
      />

      {/* ── Confirm: Clear Cache ── */}
      <AlertDialog open={pending === 'clearCache'} onOpenChange={open => { if (!open) setPending(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Réinitialiser les préférences ?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>Cette action va remettre à zéro :</p>
                <ul className="list-disc list-inside space-y-1 text-foreground font-medium">
                  <li>Le thème de l'interface (clair/sombre)</li>
                  <li>Les tarifs configurés (prix des sessions)</li>
                  <li>Toutes les autres préférences locales</li>
                </ul>
                <p className="text-green-400 font-medium mt-2">
                  ✓ Vos sessions, historique et utilisateurs ne sont <strong>pas</strong> affectés.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <button
              onClick={() => handleConfirm('clearCache')}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            >
              Réinitialiser les préférences
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm: Reset DB — requires typed phrase ── */}
      <AlertDialog open={pending === 'resetDb'} onOpenChange={open => { if (!open) { setPending(null); setResetPhrase('') } }}>
        <AlertDialogContent className="max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              Effacer toutes les données ?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                {/* What gets deleted */}
                <div
                  className="rounded-lg px-4 py-3 space-y-1"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Sera supprimé définitivement :</p>
                  <p className="text-foreground font-medium">Sessions · Shifts · Stations · Utilisateurs</p>
                  <p className="text-xs text-red-400/80 mt-1">Cette action est irréversible.</p>
                </div>

                {/* What is kept */}
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
                >
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">Conservé :</p>
                  <p className="text-green-400 font-medium">✓ Votre licence reste active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Vous n'aurez pas à réactiver l'application.</p>
                </div>

                {/* Typed confirmation */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Pour confirmer, tapez exactement la phrase suivante :
                  </p>
                  <div
                    className="rounded-lg px-3 py-2 font-mono text-xs select-all"
                    style={{
                      background: 'var(--muted)',
                      border: '1px dashed var(--border)',
                      color: 'var(--foreground)',
                      letterSpacing: '0.01em',
                      userSelect: 'all',
                    }}
                  >
                    {EXPECTED_PHRASE}
                  </div>
                  <input
                    type="text"
                    value={resetPhrase}
                    onChange={e => setResetPhrase(e.target.value)}
                    placeholder="Tapez la phrase ici…"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none transition-all bg-black/20 text-foreground"
                    style={{
                      border: resetPhrase.length > 0
                        ? resetPhrase === EXPECTED_PHRASE
                          ? '1px solid rgba(74,222,128,0.5)'
                          : '1px solid rgba(239,68,68,0.4)'
                        : '1px solid var(--border)',
                    }}
                  />
                  {resetPhrase.length > 0 && resetPhrase !== EXPECTED_PHRASE && (
                    <p className="text-xs text-red-400">
                      La phrase ne correspond pas. Vérifiez les majuscules et apostrophes.
                    </p>
                  )}
                  {resetPhrase === EXPECTED_PHRASE && (
                    <p className="text-xs text-green-400 font-medium">✓ Phrase correcte</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetPhrase('')}>Annuler</AlertDialogCancel>
            <button
              onClick={() => handleConfirm('resetDb')}
              disabled={resetPhrase !== EXPECTED_PHRASE}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Tout effacer et redémarrer
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

// ── Reusable row component ────────────────────────────────────────────────────

function ActionRow({
  icon, iconColor, label, desc, info, toast, action,
}: {
  icon:       React.ReactNode
  iconColor:  'indigo' | 'amber' | 'red'
  label:      string
  desc:       string
  info?:      string
  toast:      { msg: string; ok: boolean } | null
  action:     React.ReactNode
}) {
  const iconBg = iconColor === 'red'
    ? 'rgba(239,68,68,0.1)'
    : iconColor === 'amber'
    ? 'rgba(245,158,11,0.1)'
    : 'rgba(99,102,241,0.1)'

  const iconFg = iconColor === 'red'
    ? '#f87171'
    : iconColor === 'amber'
    ? '#fbbf24'
    : '#818cf8'

  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3.5"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconFg }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {desc}
        </p>
        {info && (
          <p className="text-xs mt-1 flex items-start gap-1.5" style={{ color: 'var(--muted-foreground)', opacity: 0.75 }}>
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {info}
          </p>
        )}
        {toast && (
          <p
            className="text-xs mt-1.5 font-medium"
            style={{ color: toast.ok ? '#4ade80' : '#f87171' }}
          >
            {toast.ok ? '✓' : '✗'} {toast.msg}
          </p>
        )}
      </div>

      {/* Action button */}
      {action}
    </div>
  )
}