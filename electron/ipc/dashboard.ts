import { ipcMain } from 'electron'
import db from '../db/client'

ipcMain.handle('dashboard:summary', async (_e, date: string) => {
  const d = date || new Date().toISOString().slice(0, 10)
  const revenue    = (db.prepare(`SELECT COALESCE(SUM(total_amount),0) as total FROM sessions WHERE status='ended' AND DATE(started_at)=?`).get(d) as any).total
  const count      = (db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status='ended' AND DATE(started_at)=?`).get(d) as any).c
  const byType     = db.prepare(`SELECT type, COUNT(*) as c FROM sessions WHERE status='ended' AND DATE(started_at)=? GROUP BY type`).all(d)
  const avgRow     = db.prepare(`SELECT AVG(started_at_unix - ended_at_unix) as avg FROM sessions WHERE status='ended' AND ended_at_unix IS NOT NULL AND DATE(started_at)=?`).get(d) as any
  const avgMin     = avgRow?.avg ? Math.round(Math.abs(avgRow.avg) / 60) : 0
  const topStation = db.prepare(`SELECT st.name, COUNT(*) as c FROM sessions s JOIN stations st ON s.station_id=st.id WHERE s.status='ended' AND DATE(s.started_at)=? GROUP BY s.station_id ORDER BY c DESC LIMIT 1`).get(d) as any
  return { revenue, sessionCount: count, byType, avgDuration: avgMin, topStation: topStation?.name }
})

ipcMain.handle('dashboard:revenue', async (_e, period: string) => {
  if (period === 'week')
    return db.prepare(`SELECT strftime('%Y-W%W', started_at) as label, COALESCE(SUM(total_amount),0) as value FROM sessions WHERE status='ended' AND started_at >= date('now','-12 weeks') GROUP BY label ORDER BY label`).all()
  if (period === 'month')
    return db.prepare(`SELECT strftime('%Y-%m', started_at) as label, COALESCE(SUM(total_amount),0) as value FROM sessions WHERE status='ended' AND started_at >= date('now','-12 months') GROUP BY label ORDER BY label`).all()
  return db.prepare(`SELECT DATE(started_at) as label, COALESCE(SUM(total_amount),0) as value FROM sessions WHERE status='ended' AND started_at >= date('now','-30 days') GROUP BY label ORDER BY label`).all()
})

ipcMain.handle('dashboard:stationStats', async () => {
  return db.prepare(`SELECT st.name, COUNT(s.id) as sessions, COALESCE(SUM(s.total_amount),0) as revenue FROM stations st LEFT JOIN sessions s ON st.id=s.station_id AND s.status='ended' GROUP BY st.id ORDER BY revenue DESC`).all()
})

ipcMain.handle('dashboard:peakHours', async () => {
  return db.prepare(`
    SELECT
      strftime('%w', started_at) as dow,
      strftime('%H', started_at) as hour,
      COUNT(*) as count
    FROM sessions
    WHERE status = 'ended'
      AND CAST(strftime('%H', started_at) AS INTEGER) BETWEEN 9 AND 23
    GROUP BY dow, hour
    ORDER BY dow, hour
  `).all()
})

ipcMain.handle('dashboard:managerActivity', async () => {
  return db.prepare(`SELECT u.username, COUNT(s.id) as sessions, COALESCE(SUM(s.total_amount),0) as revenue FROM users u LEFT JOIN sessions s ON u.id=s.manager_id AND s.status='ended' WHERE u.role='manager' GROUP BY u.id ORDER BY revenue DESC`).all()
})

// ─── WEEK COMPARISON (cette semaine vs semaine précédente) ────────────────────
ipcMain.handle('dashboard:weekComparison', async () => {
  const thisWeek = (db.prepare(`
    SELECT
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as sessions
    FROM sessions
    WHERE status = 'ended'
      AND started_at >= date('now', 'weekday 1', '-7 days')
      AND started_at < date('now', 'weekday 1')
  `).get() as any)

  const lastWeek = (db.prepare(`
    SELECT
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as sessions
    FROM sessions
    WHERE status = 'ended'
      AND started_at >= date('now', 'weekday 1', '-14 days')
      AND started_at < date('now', 'weekday 1', '-7 days')
  `).get() as any)

  // Daily breakdown for this week (Mon=1 to Sun=7 in ISO, but sqlite %w 0=Sun)
  const thisWeekDays = db.prepare(`
    SELECT
      DATE(started_at) as day,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as sessions
    FROM sessions
    WHERE status = 'ended'
      AND started_at >= date('now', 'weekday 1', '-7 days')
      AND started_at < date('now', 'weekday 1')
    GROUP BY day ORDER BY day
  `).all()

  const lastWeekDays = db.prepare(`
    SELECT
      DATE(started_at) as day,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as sessions
    FROM sessions
    WHERE status = 'ended'
      AND started_at >= date('now', 'weekday 1', '-14 days')
      AND started_at < date('now', 'weekday 1', '-7 days')
    GROUP BY day ORDER BY day
  `).all()

  const revenueDiff = thisWeek.revenue - lastWeek.revenue
  const revenuePct  = lastWeek.revenue > 0
    ? Math.round((revenueDiff / lastWeek.revenue) * 100)
    : (thisWeek.revenue > 0 ? 100 : 0)

  const sessionsDiff = thisWeek.sessions - lastWeek.sessions
  const sessionsPct  = lastWeek.sessions > 0
    ? Math.round((sessionsDiff / lastWeek.sessions) * 100)
    : (thisWeek.sessions > 0 ? 100 : 0)

  return {
    thisWeek: { revenue: thisWeek.revenue, sessions: thisWeek.sessions, days: thisWeekDays },
    lastWeek: { revenue: lastWeek.revenue, sessions: lastWeek.sessions, days: lastWeekDays },
    diff: { revenue: revenueDiff, revenuePct, sessions: sessionsDiff, sessionsPct },
  }
})