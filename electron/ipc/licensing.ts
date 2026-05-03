import { ipcMain } from 'electron'
import db from '../db/client'
import crypto from 'crypto'

const TRIAL_DAYS = 7
const TRIAL_MS   = TRIAL_DAYS * 24 * 60 * 60 * 1000

const SECRET_KEY = crypto.createHash('sha256').update('PLAYDESK_MASTER_2024').digest()

// ─── Crypto ───────────────────────────────────────────────────────────────────

// Decrypts embedded payload → array of { hash, expiresAt } objects
function decryptKeyList(payload: string): Array<{ hash: string; expiresAt: string }> {
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

function getKeyEntries(): Array<{ hash: string; expiresAt: string }> {
  try {
    const { EMBEDDED_KEYS } = require('../licensing/keys_embedded.js')
    return decryptKeyList(EMBEDDED_KEYS)
  } catch { return [] }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)  // "YYYY-MM-DD"
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

// ─── license:status ───────────────────────────────────────────────────────────
//
// Possible return shapes:
//   Subscription active:  { activated: true, activatedAt, subscriptionExpiresAt, daysLeft, subscriptionExpired: false }
//   Subscription expired: { activated: true, activatedAt, subscriptionExpiresAt, daysLeft: 0, subscriptionExpired: true }
//   Trial active:         { activated: false, trial: true, expired: false, trialEndsAt, daysLeft }
//   Trial expired:        { activated: false, trial: true, expired: true }
//   Fresh install:        { activated: false, trial: false }
//
ipcMain.handle('license:status', async () => {
  try {
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as any
    if (!row) return { activated: false, trial: false }

    // ── Subscription ──────────────────────────────────────────────────────────
    if (row.active === 1) {
      const expiresAt        = row.subscription_expires_at as string | null
      const subscriptionExpired = expiresAt ? today() > expiresAt : false
      const daysLeft         = expiresAt ? daysUntil(expiresAt) : 0

      return {
        activated:              true,
        activatedAt:            row.activated_at,
        subscriptionExpiresAt:  expiresAt,
        subscriptionExpired,
        daysLeft,
      }
    }

    // ── Trial ─────────────────────────────────────────────────────────────────
    if (row.trial_started_at) {
      const trialEndsAt = (row.trial_started_at as number) + TRIAL_MS
      const expired     = Date.now() > trialEndsAt
      const daysLeft    = Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
      return { activated: false, trial: true, expired, trialEndsAt, daysLeft }
    }

    // ── Fresh install ─────────────────────────────────────────────────────────
    return { activated: false, trial: false }

  } catch {
    return { activated: false, trial: false }
  }
})

// ─── license:startTrial ───────────────────────────────────────────────────────
ipcMain.handle('license:startTrial', async () => {
  try {
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as any
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

  const keyHash = hashKey(trimmed)
  const entries = getKeyEntries()

  if (entries.length === 0) {
    return { success: false, error: 'Aucune clé disponible — contactez le support' }
  }

  // Find the matching entry to get its expiresAt
  const match = entries.find(e => e.hash === keyHash)
  if (!match) {
    return { success: false, error: 'Clé invalide — contactez le support' }
  }

  // Check if the key itself has already expired (e.g. customer got key late)
  if (today() > match.expiresAt) {
    return { success: false, error: `Cette clé a expiré le ${match.expiresAt} — demandez un renouvellement` }
  }

  let machineId = 'unknown'
  try { machineId = require('node-machine-id').machineIdSync() } catch {}

  // Activate — store key hash + expiry date
  // If already active (renewal), just update expiry and key_hash
  db.prepare(`
    UPDATE license
    SET key_hash = ?, machine_id = ?, activated_at = datetime('now'),
        active = 1, subscription_expires_at = ?
    WHERE id = 1
  `).run(keyHash, machineId, match.expiresAt)

  return { success: true, expiresAt: match.expiresAt }
})