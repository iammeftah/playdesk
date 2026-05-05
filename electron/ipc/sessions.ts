import { ipcMain } from 'electron'
import db from '../db/client'

function nowUnix(): number {
  return Math.floor(Date.now() / 1000)
}

function calcTotal(session: any, elapsedSeconds: number): number {
  if (session.type === 'match') {
    const priceMap: Record<number, number> = { 6: 7, 7: 8 }
    const price = priceMap[session.match_duration] ?? 10
    return session.match_count * price
  }
  if (session.type === 'temps') {
    const hours = (session.prepaid_minutes ?? 60) / 60
    return hours * 30
  }
  const minutes = Math.ceil(elapsedSeconds / 60)
  return minutes * (30 / 60)
}

function getElapsedSeconds(session: any): number {
  const startedAt = session.started_at_unix ?? Math.floor(new Date(session.started_at).getTime() / 1000)
  const now = nowUnix()
  let elapsed = now - startedAt - (session.paused_duration ?? 0)
  if (session.status === 'paused' && session.paused_at_unix) {
    elapsed = session.paused_at_unix - startedAt - (session.paused_duration ?? 0)
  }
  return Math.max(0, elapsed)
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

ipcMain.handle('sessions:start', async (_e, data: any) => {
  const existing = db.prepare(
    "SELECT id FROM sessions WHERE station_id = ? AND status != 'ended'"
  ).get(data.stationId) as any
  if (existing) {
    db.prepare(
      "UPDATE sessions SET status = 'ended', ended_at = datetime('now'), ended_at_unix = ? WHERE id = ?"
    ).run(nowUnix(), existing.id)
  }

  const result = db.prepare(
    `INSERT INTO sessions (station_id, manager_id, type, match_duration, prepaid_minutes, started_at_unix)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    data.stationId,
    data.managerId,
    data.type,
    data.matchDuration ?? null,
    data.prepaidMinutes ?? null,
    nowUnix()
  )
  return { success: true, id: result.lastInsertRowid }
})

ipcMain.handle('sessions:end', async (_e, id: number, note?: string) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session) return { success: false, error: 'Session introuvable' }

  const elapsed = getElapsedSeconds(session)
  const total = calcTotal(session, elapsed)

  db.prepare(
    `UPDATE sessions SET status = 'ended', ended_at = datetime('now'), ended_at_unix = ?,
     total_amount = ?, note = ? WHERE id = ?`
  ).run(nowUnix(), total, note ?? null, id)

  return { success: true, total, elapsed }
})

ipcMain.handle('sessions:extend', async (_e, id: number, extraMinutes: number) => {
  if (!extraMinutes || extraMinutes <= 0) return { success: false, error: 'Durée invalide' }
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session) return { success: false, error: 'Session introuvable' }
  if (session.status === 'ended') return { success: false, error: 'Session déjà terminée' }
  if (session.type !== 'temps') return { success: false, error: 'Extension uniquement pour sessions Temps' }

  const newMinutes = (session.prepaid_minutes ?? 0) + extraMinutes
  db.prepare('UPDATE sessions SET prepaid_minutes = ? WHERE id = ?').run(newMinutes, id)
  return { success: true, newPrepaidMinutes: newMinutes }
})

ipcMain.handle('sessions:transfer', async (_e, sessionId: number, targetStationId: number) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any
  if (!session) return { success: false, error: 'Session introuvable' }
  if (session.status === 'ended') return { success: false, error: 'Session déjà terminée' }
  if (session.station_id === targetStationId) return { success: false, error: 'Station identique' }

  const conflict = db.prepare(
    "SELECT id FROM sessions WHERE station_id = ? AND status != 'ended'"
  ).get(targetStationId) as any
  if (conflict) {
    const cs = db.prepare('SELECT * FROM sessions WHERE id = ?').get(conflict.id) as any
    const elapsed = getElapsedSeconds(cs)
    const total = calcTotal(cs, elapsed)
    db.prepare(
      "UPDATE sessions SET status = 'ended', ended_at = datetime('now'), ended_at_unix = ?, total_amount = ? WHERE id = ?"
    ).run(nowUnix(), total, conflict.id)
  }

  db.prepare('UPDATE sessions SET station_id = ? WHERE id = ?').run(targetStationId, sessionId)
  return { success: true }
})

ipcMain.handle('sessions:undoEnd', async (_e, id: number) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session) return { success: false, error: 'Session introuvable' }
  if (session.status !== 'ended') return { success: false, error: 'La session n\'est pas terminée' }

  const endedAtUnix = session.ended_at_unix as number | null
  if (!endedAtUnix || nowUnix() - endedAtUnix > 15) {
    return { success: false, error: 'Délai d\'annulation dépassé' }
  }

  const conflict = db.prepare(
    "SELECT id FROM sessions WHERE station_id = ? AND status != 'ended' AND id != ?"
  ).get(session.station_id, id) as any
  if (conflict) {
    return { success: false, error: 'Une autre session est déjà active sur cette station' }
  }

  db.prepare(
    `UPDATE sessions SET status = 'active', ended_at = NULL, ended_at_unix = NULL, total_amount = NULL WHERE id = ?`
  ).run(id)

  return { success: true }
})

ipcMain.handle('sessions:undoAddMatch', async (_e, id: number, previousCount: number) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session) return { success: false, error: 'Session introuvable' }
  if (session.status === 'ended') return { success: false, error: 'Session déjà terminée' }
  if (previousCount < 0) return { success: false, error: 'Valeur invalide' }

  db.prepare('UPDATE sessions SET match_count = ? WHERE id = ?').run(previousCount, id)
  return { success: true, matchCount: previousCount }
})

ipcMain.handle('sessions:pause', async (_e, id: number) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session || session.status !== 'active') return { success: false }
  db.prepare(
    "UPDATE sessions SET status = 'paused', paused_at_unix = ? WHERE id = ?"
  ).run(nowUnix(), id)
  return { success: true }
})

ipcMain.handle('sessions:resume', async (_e, id: number) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
  if (!session || session.status !== 'paused') return { success: false }

  const pausedAt = session.paused_at_unix ?? nowUnix()
  const additionalPause = nowUnix() - pausedAt

  db.prepare(
    "UPDATE sessions SET status = 'active', paused_duration = paused_duration + ?, paused_at_unix = NULL WHERE id = ?"
  ).run(additionalPause, id)
  return { success: true }
})

ipcMain.handle('sessions:addMatch', async (_e, id: number) => {
  db.prepare('UPDATE sessions SET match_count = match_count + 1 WHERE id = ?').run(id)
  const session = db.prepare('SELECT match_count FROM sessions WHERE id = ?').get(id) as any
  return { success: true, matchCount: session.match_count }
})

ipcMain.handle('sessions:active', async () => {
  return db.prepare(
    `SELECT s.*, st.name as station_name, u.username as manager_name
     FROM sessions s
     JOIN stations st ON s.station_id = st.id
     JOIN users u ON s.manager_id = u.id
     WHERE s.status != 'ended'`
  ).all()
})

ipcMain.handle('sessions:history', async (_e, filters: any = {}) => {
  let query = `SELECT s.*, st.name as station_name, u.username as manager_name
               FROM sessions s
               JOIN stations st ON s.station_id = st.id
               JOIN users u ON s.manager_id = u.id
               WHERE s.status = 'ended'`
  const params: any[] = []
  if (filters.date)      { query += ' AND DATE(s.started_at) = ?'; params.push(filters.date) }
  if (filters.stationId) { query += ' AND s.station_id = ?';       params.push(filters.stationId) }
  if (filters.managerId) { query += ' AND s.manager_id = ?';       params.push(filters.managerId) }
  if (filters.type)      { query += ' AND s.type = ?';             params.push(filters.type) }
  query += ' ORDER BY s.ended_at_unix DESC LIMIT 500'
  return db.prepare(query).all(...params)
})

// ─── SHIFT MANAGEMENT ────────────────────────────────────────────────────────
//
// Shift lifecycle:
//   open    → manager arrives, shift created (status = 'open')
//   pause   → manager break (status = 'paused', paused_at_unix set)
//             No new sessions can be started while paused.
//   resume  → back from break (status = 'open', paused_duration accumulated)
//   close   → end of day; only allowed when 0 active sessions
//             Computes revenue across all sessions ended within this shift window.
//
// A manager can have at most ONE open/paused shift at a time.
// Multiple shifts per day are allowed (open → close → open → close, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute total revenue and session count for a shift.
 * Sums sessions ended between shift.opened_at_unix and now (or closed_at_unix).
 * Excludes time when the shift was paused (sessions can't end during a pause anyway).
 */
function computeShiftTotals(shiftId: number): { revenue: number; sessionCount: number } {
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as any
  if (!shift) return { revenue: 0, sessionCount: 0 }

  const endTs = shift.closed_at_unix ?? nowUnix()

  const row = db.prepare(
    `SELECT COALESCE(SUM(s.total_amount), 0) as revenue, COUNT(*) as sessionCount
     FROM sessions s
     WHERE s.manager_id = ?
       AND s.status = 'ended'
       AND s.ended_at_unix >= ?
       AND s.ended_at_unix <= ?`
  ).get(shift.manager_id, shift.opened_at_unix, endTs) as any

  return { revenue: row.revenue ?? 0, sessionCount: row.sessionCount ?? 0 }
}

// ── shifts:open ───────────────────────────────────────────────────────────────
ipcMain.handle('shifts:open', async (_e, managerId: number) => {
  // Prevent double-open: if already open or paused, return the existing shift
  const existing = db.prepare(
    "SELECT * FROM shifts WHERE manager_id = ? AND status IN ('open', 'paused') ORDER BY opened_at_unix DESC LIMIT 1"
  ).get(managerId) as any
  if (existing) return { success: true, id: existing.id, alreadyOpen: true }

  const result = db.prepare(
    `INSERT INTO shifts (manager_id, opened_at, opened_at_unix, status) VALUES (?, datetime('now'), ?, 'open')`
  ).run(managerId, nowUnix())

  return { success: true, id: result.lastInsertRowid }
})

// ── shifts:pause ──────────────────────────────────────────────────────────────
ipcMain.handle('shifts:pause', async (_e, managerId: number) => {
  const shift = db.prepare(
    "SELECT * FROM shifts WHERE manager_id = ? AND status = 'open' ORDER BY opened_at_unix DESC LIMIT 1"
  ).get(managerId) as any
  if (!shift) return { success: false, error: 'Aucun shift ouvert' }

  db.prepare(
    `UPDATE shifts SET status = 'paused', paused_at_unix = ? WHERE id = ?`
  ).run(nowUnix(), shift.id)

  return { success: true }
})

// ── shifts:resume ─────────────────────────────────────────────────────────────
ipcMain.handle('shifts:resume', async (_e, managerId: number) => {
  const shift = db.prepare(
    "SELECT * FROM shifts WHERE manager_id = ? AND status = 'paused' ORDER BY opened_at_unix DESC LIMIT 1"
  ).get(managerId) as any
  if (!shift) return { success: false, error: 'Aucun shift en pause' }

  const pausedAt = shift.paused_at_unix ?? nowUnix()
  const additionalPause = nowUnix() - pausedAt

  db.prepare(
    `UPDATE shifts SET status = 'open',
       paused_duration = COALESCE(paused_duration, 0) + ?,
       paused_at_unix = NULL
     WHERE id = ?`
  ).run(additionalPause, shift.id)

  return { success: true }
})

// ── shifts:close ──────────────────────────────────────────────────────────────
ipcMain.handle('shifts:close', async (_e, managerId: number) => {
  const shift = db.prepare(
    "SELECT * FROM shifts WHERE manager_id = ? AND status IN ('open', 'paused') ORDER BY opened_at_unix DESC LIMIT 1"
  ).get(managerId) as any
  if (!shift) return { success: false, error: 'Aucun shift ouvert' }

  // Safety: block if any active sessions exist for this manager
  const activeSessions = db.prepare(
    "SELECT COUNT(*) as c FROM sessions WHERE manager_id = ? AND status != 'ended'"
  ).get(managerId) as any
  if (activeSessions.c > 0) {
    return { success: false, error: 'Des sessions sont encore actives — clôturez-les avant de terminer le shift' }
  }

  const { revenue, sessionCount } = computeShiftTotals(shift.id)

  db.prepare(
    `UPDATE shifts SET closed_at = datetime('now'), closed_at_unix = ?, status = 'closed',
     total_revenue = ?, session_count = ? WHERE id = ?`
  ).run(nowUnix(), revenue, sessionCount, shift.id)

  return { success: true, revenue, sessionCount }
})

// ── shifts:current ────────────────────────────────────────────────────────────
// Returns the current open OR paused shift for a manager.
ipcMain.handle('shifts:current', async (_e, managerId: number) => {
  return db.prepare(
    "SELECT * FROM shifts WHERE manager_id = ? AND status IN ('open', 'paused') ORDER BY opened_at_unix DESC LIMIT 1"
  ).get(managerId) ?? null
})

// ── shifts:history ────────────────────────────────────────────────────────────
ipcMain.handle('shifts:history', async (_e, filters: any = {}) => {
  let query = `SELECT sh.*, u.username FROM shifts sh JOIN users u ON sh.manager_id = u.id WHERE 1=1`
  const params: any[] = []
  if (filters.managerId) { query += ' AND sh.manager_id = ?'; params.push(filters.managerId) }
  if (filters.date)      { query += ' AND DATE(sh.opened_at) = ?'; params.push(filters.date) }
  query += ' ORDER BY sh.opened_at_unix DESC LIMIT 200'
  return db.prepare(query).all(...params)
})

// ── shifts:todayTotal ─────────────────────────────────────────────────────────
ipcMain.handle('shifts:todayTotal', async () => {
  const today = new Date().toISOString().slice(0, 10)
  return db.prepare(
    `SELECT sh.*, u.username,
       (SELECT COALESCE(SUM(s.total_amount), 0) FROM sessions s
        WHERE s.manager_id = sh.manager_id AND s.status = 'ended'
          AND s.ended_at_unix >= sh.opened_at_unix
          AND s.ended_at_unix <= COALESCE(sh.closed_at_unix, strftime('%s','now'))
       ) as computed_revenue,
       (SELECT COUNT(*) FROM sessions s
        WHERE s.manager_id = sh.manager_id AND s.status = 'ended'
          AND s.ended_at_unix >= sh.opened_at_unix
          AND s.ended_at_unix <= COALESCE(sh.closed_at_unix, strftime('%s','now'))
       ) as computed_sessions
     FROM shifts sh JOIN users u ON sh.manager_id = u.id
     WHERE DATE(sh.opened_at) = ?
     ORDER BY sh.opened_at_unix ASC`
  ).all(today)
})