import * as fs from 'fs'
import * as path from 'path'
import { generateKey, encrypt, decrypt, hashKey } from './crypto'

const DB_FILE = path.join(__dirname, 'keys.json')

interface KeyRecord {
  key: string
  hash: string
  createdAt: string
  used: boolean
  usedAt?: string
  machineId?: string
}

function loadKeys(): KeyRecord[] {
  if (!fs.existsSync(DB_FILE)) return []
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

function saveKeys(keys: KeyRecord[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(keys, null, 2))
}

function generate(n: number) {
  const keys = loadKeys()
  const newKeys: KeyRecord[] = []

  for (let i = 0; i < n; i++) {
    const key = generateKey()
    newKeys.push({
      key,
      hash: hashKey(key),
      createdAt: new Date().toISOString(),
      used: false,
    })
    console.log(`  ✓ ${key}`)
  }

  saveKeys([...keys, ...newKeys])
  exportEmbeddable([...keys, ...newKeys])
  console.log(`\n${n} clé(s) générée(s). Fichier keys_embedded.ts mis à jour.`)
}

function list() {
  const keys = loadKeys()
  if (keys.length === 0) { console.log('Aucune clé générée.'); return }
  console.log(`\n${'Clé'.padEnd(22)} ${'Créée le'.padEnd(12)} ${'Statut'}`)
  console.log('─'.repeat(55))
  for (const k of keys) {
    const date = k.createdAt.slice(0, 10)
    const status = k.used ? `✗ Utilisée (${k.usedAt?.slice(0,10)})` : '✓ Disponible'
    console.log(`${k.key.padEnd(22)} ${date.padEnd(12)} ${status}`)
  }
  const used = keys.filter(k => k.used).length
  console.log(`\nTotal: ${keys.length} | Utilisées: ${used} | Disponibles: ${keys.length - used}`)
}

function exportEmbeddable(keys: KeyRecord[]) {
  const hashes = keys.map(k => k.hash)
  const payload = encrypt(JSON.stringify(hashes))
  const output = `// Auto-generated — DO NOT EDIT — DO NOT COMMIT\nexport const EMBEDDED_KEYS = '${payload}';\n`
  const outPath = path.join(__dirname, '..', '..', 'electron', 'licensing', 'keys_embedded.ts')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, output)
}

const cmd = process.argv[2]
const arg = parseInt(process.argv[3] ?? '1')

if (cmd === 'generate') generate(arg)
else if (cmd === 'list') list()
else console.log('Usage: ts-node index.ts generate <n> | list')
