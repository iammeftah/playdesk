import { ipcMain } from 'electron'
import db from '../db/client'

ipcMain.handle('dashboard:summary', async (_e, date: string) => {
  const d = date || new Date().toISOString().slice(0, 10)
  const revenue   = (db.prepare(`SELECT COALESCE(SUM(total_amount),0) as total FROM sessions WHERE status='ended' AND DATE(started_at)=?`).get(d) as any).total
  const count     = (db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE status='ended' AND DATE(started_at)=?`).get(d) as any).c
  const byType    = db.prepare(`SELECT type, COUNT(*) as c FROM sessions WHERE status='ended' AND DATE(started_at)=? GROUP BY type`).all(d)
  const avgRow    = db.prepare(`SELECT AVG(started_at_unix - ended_at_unix) as avg FROM sessions WHERE status='ended' AND ended_at_unix IS NOT NULL AND DATE(started_at)=?`).get(d) as any
  const avgMin    = avgRow?.avg ? Math.round(Math.abs(avgRow.avg) / 60) : 0
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
  return db.prepare(`SELECT strftime('%H', started_at) as hour, COUNT(*) as count FROM sessions WHERE status='ended' GROUP BY hour ORDER BY hour`).all()
})

ipcMain.handle('dashboard:managerActivity', async () => {
  return db.prepare(`SELECT u.username, COUNT(s.id) as sessions, COALESCE(SUM(s.total_amount),0) as revenue FROM users u LEFT JOIN sessions s ON u.id=s.manager_id AND s.status='ended' WHERE u.role='manager' GROUP BY u.id ORDER BY revenue DESC`).all()
})
