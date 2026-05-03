import * as crypto from 'crypto'

const AES_SECRET = 'PLAYDESK_SECRET_KEY_CHANGE_THIS_32CHARS!!' // 32 chars exactly
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(AES_SECRET), iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(AES_SECRET), iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}

export function generateKey(): string {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4)
  return `PLAY-${seg()}-${seg()}-${seg()}`
}

export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
