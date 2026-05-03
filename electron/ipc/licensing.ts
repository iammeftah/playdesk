import { ipcMain } from 'electron'
import db from '../db/client'
import crypto from 'crypto'

const TRIAL_DAYS = 7
const TRIAL_MS   = TRIAL_DAYS * 24 * 60 * 60 * 1000

// Must match keygen.js exactly
const SECRET_KEY = crypto.createHash('sha256').update('PLAYDESK_MASTER_2024').digest()

function decryptKeyList(payload: string): string[] {
  try {
    const [ivHex, encryptedHex] = payload.split(':')
    const iv        = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher  = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
    return JSON.parse(decrypted)
  } catch { return [] }
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function getValidKeyHashes(): string[] {
  try {
    const { EMBEDDED_KEYS } = require('../licensing/keys_embedded.js')
    return decryptKeyList(EMBEDDED_KEYS)
  } catch { return [] }
}

// ─── license:status ────────────────────────────────────────────────────────────
// Returns one of three states:
//   { activated: true, activatedAt }               — full license
//   { activated: false, trial: true, trialEndsAt, daysLeft, expired: false }  — active trial
//   { activated: false, trial: true, expired: true }                          — trial expired
//   { activated: false, trial: false }             — fresh install, no choice yet
ipcMain.handle('license:status', async () => {
  try {
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as any

    if (!row) return { activated: false, trial: false }

    // Full license
    if (row.active === 1) {
      return { activated: true, activatedAt: row.activated_at }
    }

    // Trial in progress or expired
    if (row.trial_started_at) {
      const startedAt  = row.trial_started_at as number   // unix ms
      const trialEndsAt = startedAt + TRIAL_MS
      const now         = Date.now()
      const daysLeft    = Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
      const expired     = now > trialEndsAt

      return {
        activated: false,
        trial: true,
        expired,
        trialEndsAt,
        daysLeft,
      }
    }

    // Fresh install — no choice made yet
    return { activated: false, trial: false }

  } catch {
    return { activated: false, trial: false }
  }
})

// ─── license:startTrial ────────────────────────────────────────────────────────
ipcMain.handle('license:startTrial', async () => {
  try {
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as any

    // Don't restart trial if already started or activated
    if (row?.trial_started_at || row?.active === 1) {
      return { success: false, error: 'Essai déjà démarré ou licence active' }
    }

    db.prepare('UPDATE license SET trial_started_at = ? WHERE id = 1').run(Date.now())
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ─── license:activate ─────────────────────────────────────────────────────────
ipcMain.handle('license:activate', async (_e, key: string) => {
  const trimmed = key.trim().toUpperCase()

  const pattern = /^PLAY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  if (!pattern.test(trimmed)) {
    return { success: false, error: 'Format invalide — attendu: PLAY-XXXX-XXXX-XXXX' }
  }

  const keyHash    = hashKey(trimmed)
  const validHashes = getValidKeyHashes()

  if (validHashes.length === 0) {
    return { success: false, error: 'Aucune clé disponible — contactez le support' }
  }

  if (!validHashes.includes(keyHash)) {
    return { success: false, error: 'Clé invalide ou déjà utilisée' }
  }

  // Already activated
  const existing = db.prepare('SELECT * FROM license WHERE id = 1').get() as any
  if (existing?.active === 1) return { success: true }

  let machineId = 'unknown'
  try { machineId = require('node-machine-id').machineIdSync() } catch {}

  db.prepare(
    `UPDATE license SET key_hash = ?, machine_id = ?, activated_at = datetime('now'), active = 1 WHERE id = 1`
  ).run(keyHash, machineId)

  return { success: true }
})