import { ipcMain } from 'electron'
import db from '../db/client'
import bcrypt from 'bcryptjs'

ipcMain.handle('users:list', async () => {
  return db.prepare('SELECT id, username, role, active, created_at FROM users ORDER BY id ASC').all()
})

ipcMain.handle('users:create', async (_e, data: { username: string; password: string; role: string }) => {
  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(data.username)
    if (existing) return { success: false, error: 'Ce nom d\'utilisateur existe déjà' }
    const hash = bcrypt.hashSync(data.password, 10)
    const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(data.username, hash, data.role)
    return { success: true, id: result.lastInsertRowid }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('users:update', async (_e, id: number, data: { username?: string; password?: string; role?: string }) => {
  if (data.username) db.prepare('UPDATE users SET username = ? WHERE id = ?').run(data.username, id)
  if (data.password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(data.password, 10), id)
  if (data.role)     db.prepare('UPDATE users SET role = ? WHERE id = ?').run(data.role, id)
  return { success: true }
})

ipcMain.handle('users:disable', async (_e, id: number) => {
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id)
  return { success: true }
})
