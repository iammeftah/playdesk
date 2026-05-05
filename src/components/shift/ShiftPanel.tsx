import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Clock, Users, RefreshCw, AlertTriangle, Coffee } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useShiftStore } from '../../store/useShiftStore'
import { formatMAD } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Shift {
  id:               number
  manager_id:       number
  username:         string
  opened_at:        string
  opened_at_unix:   number
  closed_at?:       string
  closed_at_unix?:  number
  paused_at_unix?:  number
  paused_duration?: number
  status:           'open' | 'paused' | 'closed'
  total_revenue?:   number
  session_count?:   number
  computed_revenue?:  number
  computed_sessions?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(openedAt: string, closedAt?: string): string {
  const start = new Date(openedAt).getTime()
  const end   = closedAt ? new Date(closedAt).getTime() : Date.now()
  const mins  = Math.floor((end - start) / 60000)
  const h     = Math.floor(mins / 60)
  const m     = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

function formatSecs(s: number): string {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function computeShiftElapsed(shift: Shift): number {
  const start       = shift.opened_at_unix
  const now         = Math.floor(Date.now() / 1000)
  const pausedSoFar = shift.paused_duration ?? 0

  if (shift.status === 'paused') {
    const pausedAt = shift.paused_at_unix ?? now
    return Math.max(0, pausedAt - start - pausedSoFar)
  }

  return Math.max(0, now - start - pausedSoFar)
}

// ─── ShiftDialogs ─────────────────────────────────────────────────────────────

function ShiftDialogs({
  closeDialog, closeBlockDialog, resultDialog, closeResult, loading,
  onCancelClose, onConfirmClose, onDismissBlock, onDismissResult,
}: {
  closeDialog:      boolean
  closeBlockDialog: boolean
  resultDialog:     boolean
  closeResult:      { revenue: number; sessionCount: number } | null
  loading:          boolean
  onCancelClose:    () => void
  onConfirmClose:   () => void
  onDismissBlock:   () => void
  onDismissResult:  () => void
}) {
  return (
    <>
      {/* Confirm close */}
      <Dialog open={closeDialog} onOpenChange={(open) => { if (!open) onCancelClose() }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Clôturer le shift ?</DialogTitle>
            <DialogDescription>
              Toutes les stations sont libres. Confirmez la clôture du shift pour enregistrer les totaux.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onCancelClose}>Annuler</Button>
            <Button variant="destructive" onClick={onConfirmClose} disabled={loading}>
              {loading ? 'Clôture...' : 'Confirmer la clôture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block — active sessions exist for this manager */}
      <Dialog open={closeBlockDialog} onOpenChange={(open) => { if (!open) onDismissBlock() }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <DialogTitle>Impossible de clôturer</DialogTitle>
            </div>
            <DialogDescription>
              Des sessions sont encore actives sur vos stations. Terminez et encaissez toutes vos stations avant de clôturer le shift.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onDismissBlock}>Retour au tableau</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result summary — always mounted, content gated on closeResult */}
      <Dialog open={resultDialog} onOpenChange={(open) => { if (!open) onDismissResult() }}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Shift clôturé ✓</DialogTitle>
            <DialogDescription>Récapitulatif du shift</DialogDescription>
          </DialogHeader>
          {closeResult && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="bg-muted rounded-lg px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total encaissé</p>
                <p className="font-mono font-bold text-lg text-foreground mt-1">
                  {formatMAD(closeResult.revenue)}
                </p>
              </div>
              <div className="bg-muted rounded-lg px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sessions</p>
                <p className="font-mono font-bold text-lg text-foreground mt-1">
                  {closeResult.sessionCount}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={onDismissResult} className="w-full">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Manager shift control ─────────────────────────────────────────────────────

export function ShiftControl({
  onRefresh,
  onShiftChange,
}: {
  onRefresh?:     () => void
  /**
   * Fired whenever shift status changes (open / paused / null after close).
   * The parent uses this to derive hasActiveShift correctly — based on the
   * real shift row, not on session counts which are 0 when no sessions exist yet.
   */
  onShiftChange?: (shift: Shift | null) => void
}) {
  const { user }           = useAuthStore()
  const { setActiveShift } = useShiftStore()

  const [shift, setShift]     = useState<Shift | null>(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const [closeDialog, setCloseDialog]           = useState(false)
  const [closeBlockDialog, setCloseBlockDialog] = useState(false)
  const [resultDialog, setResultDialog]         = useState(false)
  const [closeResult, setCloseResult]           = useState<{ revenue: number; sessionCount: number } | null>(null)

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const shiftChangeRef = useRef(onShiftChange)
  shiftChangeRef.current = onShiftChange

  const loadShift = useCallback(async () => {
    if (!user) return
    const s     = await window.playdesk.shifts.current(user.id)
    const typed = s as Shift | null
    setShift(typed)
    setActiveShift(typed)
    // Sync elapsed unconditionally — ensures the paused display shows the
    // correct frozen value right after handlePause → loadShift completes
    setElapsed(typed ? computeShiftElapsed(typed) : 0)
    shiftChangeRef.current?.(typed)
  }, [user?.id])

  useEffect(() => { loadShift() }, [loadShift])

  // Ticker — only runs while shift is 'open'; stops automatically on pause/close
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!shift || shift.status !== 'open') return

    intervalRef.current = setInterval(() => {
      setElapsed(computeShiftElapsed(shift))
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [shift?.id, shift?.status, shift?.paused_duration])

  const handleOpen = async () => {
    if (!user) return
    setLoading(true)
    await window.playdesk.shifts.open(user.id)
    await loadShift()
    onRefresh?.()
    setLoading(false)
  }

  const handlePause = async () => {
    if (!user) return
    setLoading(true)
    await window.playdesk.shifts.pause(user.id)
    await loadShift()   // shift.status → 'paused'; ticker stops; elapsed freezes
    onRefresh?.()
    setLoading(false)
  }

  const handleResume = async () => {
    if (!user) return
    setLoading(true)
    await window.playdesk.shifts.resume(user.id)
    await loadShift()   // shift.status → 'open'; ticker restarts
    onRefresh?.()
    setLoading(false)
  }

  const handleCloseRequest = async () => {
    if (!user) return
    const allActive = await window.playdesk.sessions.active()
    // Only block on THIS manager's active sessions, not other managers'
    const myActive  = allActive.filter((s: any) => s.manager_id === user.id)
    if (myActive.length > 0) {
      setCloseBlockDialog(true)
      return
    }
    setCloseDialog(true)
  }

  const handleCloseConfirm = async () => {
    if (!user) return
    setCloseDialog(false)
    setLoading(true)
    const res = await window.playdesk.shifts.close(user.id)
    setLoading(false)

    if (res.success) {
      // Set result BEFORE clearing shift so the dialog has data while open
      setCloseResult({ revenue: res.revenue ?? 0, sessionCount: res.sessionCount ?? 0 })
      setResultDialog(true)
      await loadShift()   // shift → null; onShiftChange(null) notifies parent
      onRefresh?.()
    }
  }

  const handleDismissResult = () => {
    setResultDialog(false)
    setTimeout(() => setCloseResult(null), 300)
  }

  // Dialogs rendered in EVERY branch so they survive the shift→null transition
  const dialogs = (
    <ShiftDialogs
      closeDialog={closeDialog}
      closeBlockDialog={closeBlockDialog}
      resultDialog={resultDialog}
      closeResult={closeResult}
      loading={loading}
      onCancelClose={() => setCloseDialog(false)}
      onConfirmClose={handleCloseConfirm}
      onDismissBlock={() => setCloseBlockDialog(false)}
      onDismissResult={handleDismissResult}
    />
  )

  // ── No shift / closed ───────────────────────────────────────────────────────
  if (!shift) return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-muted/60"
      >
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Aucun shift ouvert</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Ouvrez un shift pour démarrer des sessions
          </p>
        </div>
        <Button size="sm" onClick={handleOpen} disabled={loading} className="gap-1.5 text-xs">
          <Play className="w-3 h-3" />
          {loading ? 'Ouverture...' : 'Ouvrir le shift'}
        </Button>
      </motion.div>
      {dialogs}
    </>
  )

  // ── Shift paused ────────────────────────────────────────────────────────────
  if (shift.status === 'paused') return (
    <>
      <motion.div
        key="shift-paused"
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl border bg-amber-500/5 border-amber-500/20"
      >
        <div
          className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
          style={{ boxShadow: '0 0 6px rgba(251,191,36,0.6)' }}
        />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/80">Shift en pause</p>
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{formatSecs(elapsed)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={handleResume}
            disabled={loading}
            className="gap-1.5 text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
          >
            <Play className="w-3 h-3" />
            {loading ? '...' : 'Reprendre'}
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={handleCloseRequest}
            disabled={loading}
            className="gap-1.5 text-xs border-red-400/30 text-red-500 hover:bg-red-500/10"
          >
            <Square className="w-3 h-3" />
            Clôturer
          </Button>
        </div>
      </motion.div>
      {dialogs}
    </>
  )

  // ── Shift open (active) ─────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        key="shift-open"
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-xl border bg-green-500/5 border-green-500/15"
      >
        <div
          className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"
          style={{ boxShadow: '0 0 6px rgba(74,222,128,0.7)' }}
        />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Shift en cours</p>
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{formatSecs(elapsed)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={handlePause}
            disabled={loading}
            className="gap-1.5 text-xs border-amber-400/30 text-amber-500 hover:bg-amber-500/10"
          >
            <Coffee className="w-3 h-3" />
            {loading ? '...' : 'Pause'}
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={handleCloseRequest}
            disabled={loading}
            className="gap-1.5 text-xs border-red-400/30 text-red-500 hover:bg-red-500/10"
          >
            <Square className="w-3 h-3" />
            Clôturer
          </Button>
        </div>
      </motion.div>
      {dialogs}
    </>
  )
}

// ── Admin: today's shift summary table ────────────────────────────────────────

export function ShiftHistoryPanel() {
  const [shifts, setShifts]   = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const rows = await window.playdesk.shifts.todayTotal()
    setShifts(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalRevenue  = shifts.reduce((a, s) => a + (s.computed_revenue ?? s.total_revenue ?? 0), 0)
  const totalSessions = shifts.reduce((a, s) => a + (s.computed_sessions ?? s.session_count ?? 0), 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Shifts du jour</h4>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total encaissé</p>
          <p className="font-mono font-bold text-foreground mt-0.5">{formatMAD(totalRevenue)}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sessions</p>
          <p className="font-mono font-bold text-foreground mt-0.5">{totalSessions}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : shifts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4 border border-dashed border-border rounded-lg">
          Aucun shift aujourd'hui
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {shifts.map(s => {
            const rev      = s.computed_revenue ?? s.total_revenue ?? 0
            const sessions = s.computed_sessions ?? s.session_count ?? 0
            const isOpen   = s.status === 'open'
            const isPaused = s.status === 'paused'
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                  isOpen   ? 'border-green-500/20 bg-green-500/5'  :
                  isPaused ? 'border-amber-500/20 bg-amber-500/5'  :
                             'border-border bg-muted/40'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isOpen   ? 'bg-green-400 animate-pulse' :
                  isPaused ? 'bg-amber-400'               :
                             'bg-muted-foreground/40'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{s.username}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(s.opened_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                      {s.closed_at && ` → ${new Date(s.closed_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}`}
                      {' · '}{formatDuration(s.opened_at, s.closed_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs font-bold text-foreground">{formatMAD(rev)}</p>
                  <p className="text-[10px] text-muted-foreground">{sessions} sessions</p>
                </div>
                {isOpen   && <span className="text-[9px] uppercase tracking-wider text-green-500 font-bold">En cours</span>}
                {isPaused && <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">Pause</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}