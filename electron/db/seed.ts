import db from './client'
import bcrypt from 'bcryptjs'

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL REFERENCES stations(id),
  manager_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('match', 'temps', 'libre')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'ended')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at_unix INTEGER NOT NULL DEFAULT 0,
  ended_at TEXT,
  ended_at_unix INTEGER,
  paused_duration INTEGER NOT NULL DEFAULT 0,
  paused_at TEXT,
  paused_at_unix INTEGER,
  match_count INTEGER NOT NULL DEFAULT 0,
  match_duration INTEGER,
  prepaid_minutes INTEGER,
  total_amount REAL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY DEFAULT 1,
  key_hash TEXT,
  machine_id TEXT,
  activated_at TEXT,
  active INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO license (id, active) VALUES (1, 0);
`

export function runMigrations() {
  db.exec(INIT_SQL)
  // Safe column additions for existing DBs
  const cols = (db.prepare("PRAGMA table_info(sessions)").all() as any[]).map((c: any) => c.name)
  if (!cols.includes('started_at_unix')) db.exec('ALTER TABLE sessions ADD COLUMN started_at_unix INTEGER NOT NULL DEFAULT 0')
  if (!cols.includes('ended_at_unix'))   db.exec('ALTER TABLE sessions ADD COLUMN ended_at_unix INTEGER')
  if (!cols.includes('paused_at_unix'))  db.exec('ALTER TABLE sessions ADD COLUMN paused_at_unix INTEGER')
}

export function seedAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin')
  }
}

export function seedStations() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM stations').get() as any).c
  if (count === 0) {
    const insert = db.prepare('INSERT INTO stations (name) VALUES (?)')
    for (let i = 1; i <= 4; i++) insert.run(`PS5-${i}`)
  }
}

export function initDB() {
  runMigrations()
  seedAdmin()
  seedStations()
}
