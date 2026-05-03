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
    // Fixed price based on prepaid duration — not elapsed time
    const hours = (session.prepaid_minutes ?? 60) / 60
    return hours * 30
  }
  // Libre: elapsed minutes × (30 MAD/h) to the nearest minute
  const minutes = Math.ceil(elapsedSeconds / 60)
  return minutes * (30 / 60)
}

function getElapsedSeconds(session: any): number {
  const startedAt = session.started_at_unix ?? Math.floor(new Date(session.started_at).getTime() / 1000)
  const now = nowUnix()
  let elapsed = now - startedAt - (session.paused_duration ?? 0)
  // If currently paused, don't count time since paused_at
  if (session.status === 'paused' && session.paused_at_unix) {
    elapsed = session.paused_at_unix - startedAt - (session.paused_duration ?? 0)
  }
  return Math.max(0, elapsed)
}

ipcMain.handle('sessions:start', async (_e, data: any) => {
  // End any existing active/paused session on this station
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
