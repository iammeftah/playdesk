import { ipcMain } from 'electron'
import db from '../db/client'
import crypto from 'crypto'

// Must match keygen.js exactly
const SECRET_KEY = crypto.createHash('sha256').update('PLAYDESK_MASTER_2024').digest()

// Decrypts the embedded payload → returns array of key HASHES (not plaintext keys)
function decryptKeyList(payload: string): string[] {
  try {
    const [ivHex, encryptedHex] = payload.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
    return JSON.parse(decrypted)
  } catch { return [] }
}

// SHA-256 hash of a plaintext key — matches what keygen.js stores
function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// Returns the decrypted list of valid key HASHES from the embedded payload
function getValidKeyHashes(): string[] {
  try {
    const { EMBEDDED_KEYS } = require('../licensing/keys_embedded.js')
    return decryptKeyList(EMBEDDED_KEYS)
  } catch { return [] }
}

ipcMain.handle('license:status', async () => {
  try {
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as any
    if (!row || !row.active) return { activated: false }
    return { activated: true, activatedAt: row.activated_at }
  } catch {
    return { activated: false }
  }
})

ipcMain.handle('license:activate', async (_e, key: string) => {
  const trimmed = key.trim().toUpperCase()

  // Validate format
  const pattern = /^PLAY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  if (!pattern.test(trimmed)) {
    return { success: false, error: 'Format invalide — attendu: PLAY-XXXX-XXXX-XXXX' }
  }

  // Hash the submitted key and compare against the embedded list of hashes
  const keyHash = hashKey(trimmed)
  const validHashes = getValidKeyHashes()

  if (validHashes.length === 0) {
    return { success: false, error: 'Aucune clé disponible — contactez le support' }
  }

  if (!validHashes.includes(keyHash)) {
    return { success: false, error: 'Clé invalide ou déjà utilisée' }
  }

  // Check if already activated
  const existing = db.prepare('SELECT * FROM license WHERE id = 1').get() as any
  if (existing?.active === 1) {
    return { success: true } // already activated, let through
  }

  // Get machine fingerprint
  let machineId = 'unknown'
  try {
    machineId = require('node-machine-id').machineIdSync()
  } catch {}

  // Persist activation — store key hash only (non-reversible)
  db.prepare(
    `UPDATE license SET key_hash = ?, machine_id = ?, activated_at = datetime('now'), active = 1 WHERE id = 1`
  ).run(keyHash, machineId)

  return { success: true }
})