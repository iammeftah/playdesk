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
  ended_at TEXT,
  paused_duration INTEGER NOT NULL DEFAULT 0,
  paused_at TEXT,
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
