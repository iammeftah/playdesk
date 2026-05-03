import { ipcMain } from 'electron'
import db from '../db/client'

ipcMain.handle('stations:list', async () => {
  return db.prepare('SELECT * FROM stations WHERE active = 1 ORDER BY id ASC').all()
})

ipcMain.handle('stations:add', async (_e, name: string) => {
  const result = db.prepare('INSERT INTO stations (name) VALUES (?)').run(name)
  return { success: true, id: result.lastInsertRowid, name }
})

ipcMain.handle('stations:update', async (_e, id: number, data: { name?: string; active?: number }) => {
  if (data.name !== undefined) db.prepare('UPDATE stations SET name = ? WHERE id = ?').run(data.name, id)
  if (data.active !== undefined) db.prepare('UPDATE stations SET active = ? WHERE id = ?').run(data.active, id)
  return { success: true }
})

ipcMain.handle('stations:remove', async (_e, id: number) => {
  db.prepare('UPDATE stations SET active = 0 WHERE id = ?').run(id)
  return { success: true }
})
