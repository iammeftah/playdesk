import { ipcMain } from 'electron'
import db from '../db/client'
import bcrypt from 'bcryptjs'
import { initDB } from '../db/seed'

initDB()

let currentUser: { id: number; username: string; role: string } | null = null

ipcMain.handle('auth:login', async (_e, username: string, password: string) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username) as any
  if (!user) return { success: false, error: 'Utilisateur introuvable ou désactivé' }
  if (!bcrypt.compareSync(password, user.password_hash)) return { success: false, error: 'Mot de passe incorrect' }
  currentUser = { id: user.id, username: user.username, role: user.role }
  return { success: true, user: currentUser }
})

ipcMain.handle('auth:logout', async () => { currentUser = null; return { success: true } })
ipcMain.handle('auth:current', async () => currentUser)

export { currentUser }
