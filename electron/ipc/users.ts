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

ipcMain.handle('users:enable', async (_e, id: number) => {
  db.prepare('UPDATE users SET active = 1 WHERE id = ?').run(id)
  return { success: true }
})

ipcMain.handle('users:delete', async (_e, id: number) => {
  try {
    const adminUser  = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get() as any
    const fallbackId = adminUser?.id ?? 1

    const deleteTransaction = db.transaction(() => {
      db.prepare('UPDATE sessions SET manager_id = ? WHERE manager_id = ?').run(fallbackId, id)
      db.prepare('DELETE FROM users WHERE id = ?').run(id)
    })

    deleteTransaction()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('users:changePassword', async (_e, data: { currentPassword: string; newPassword: string }) => {
  try {
    const { currentUser } = await import('./auth')
    if (!currentUser) return { success: false, error: 'Non authentifié' }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id) as any
    if (!user) return { success: false, error: 'Utilisateur introuvable' }

    if (!bcrypt.compareSync(data.currentPassword, user.password_hash))
      return { success: false, error: 'Mot de passe actuel incorrect' }

    const hash = bcrypt.hashSync(data.newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, currentUser.id)

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('users:getAvatar', async (_e, id: number) => {
  try {
    const row = db.prepare('SELECT avatar FROM users WHERE id = ?').get(id) as any
    return { success: true, avatar: row?.avatar ?? null }
  } catch (e: any) {
    return { success: false, avatar: null, error: e.message }
  }
})

ipcMain.handle('users:setAvatar', async (_e, id: number, base64: string) => {
  try {
    // Empty string means reset to default — store NULL
    if (base64 === '') {
      db.prepare('UPDATE users SET avatar = NULL WHERE id = ?').run(id)
      return { success: true }
    }

    // Must be a valid image data URI
    if (!base64.startsWith('data:image/')) {
      return { success: false, error: 'Format invalide' }
    }

    // Hard cap at ~2 MB of base64 (~2.8 MB encoded)
    if (base64.length > 2_800_000) {
      return { success: false, error: 'Image trop grande (max 2 Mo)' }
    }

    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(base64, id)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})