import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface DbMember {
  id: string
  name: string
  color: string
}

export interface DbMaintenance {
  id: string
  item_id: string
  name: string
  price: number
  date: string
}

export interface DbItem {
  id: string
  owner_id: string
  name: string
  price: number
  purchase_date: string
  status: string
  retired_date: string | null
}

export interface AppStatePayload {
  members: { id: string; name: string; color: string }[]
  items: {
    id: string
    ownerId: string
    name: string
    price: number
    purchaseDate: string
    status?: string
    retiredDate?: string
    maintenance?: { id: string; name: string; price: number; date: string }[]
  }[]
  currentView?: string
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'app.db')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    retired_date TEXT,
    FOREIGN KEY (owner_id) REFERENCES members(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

const DEFAULT_MEMBER = {
  id: 'default-member',
  name: '我',
  color: '#6c8cff',
}

function ensureDefaultMember() {
  const count = db.prepare('SELECT COUNT(*) as c FROM members').get() as { c: number }
  if (count.c === 0) {
    db.prepare('INSERT INTO members (id, name, color) VALUES (?, ?, ?)').run(
      DEFAULT_MEMBER.id,
      DEFAULT_MEMBER.name,
      DEFAULT_MEMBER.color
    )
  }
}

ensureDefaultMember()

export function getState(): AppStatePayload {
  const members = db.prepare('SELECT id, name, color FROM members').all() as unknown as DbMember[]
  const items = db
    .prepare(
      'SELECT id, owner_id, name, price, purchase_date, status, retired_date FROM items ORDER BY rowid DESC'
    )
    .all() as unknown as DbItem[]

  const maintStmt = db.prepare(
    'SELECT id, item_id, name, price, date FROM maintenance WHERE item_id = ? ORDER BY date DESC'
  )

  const viewRow = db.prepare("SELECT value FROM settings WHERE key = 'currentView'").get() as
    | { value: string }
    | undefined

  return {
    members: members.map((m) => ({ id: m.id, name: m.name, color: m.color })),
    items: items.map((item) => ({
      id: item.id,
      ownerId: item.owner_id,
      name: item.name,
      price: item.price,
      purchaseDate: item.purchase_date,
      status: item.status,
      retiredDate: item.retired_date ?? undefined,
      maintenance: (maintStmt.all(item.id) as unknown as DbMaintenance[]).map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        date: m.date,
      })),
    })),
    currentView: viewRow?.value ?? 'family',
  }
}

export function saveState(payload: AppStatePayload) {
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM maintenance').run()
    db.prepare('DELETE FROM items').run()
    db.prepare('DELETE FROM members').run()

    const insertMember = db.prepare('INSERT INTO members (id, name, color) VALUES (?, ?, ?)')
    for (const m of payload.members) {
      insertMember.run(m.id, m.name, m.color)
    }

    const insertItem = db.prepare(
      'INSERT INTO items (id, owner_id, name, price, purchase_date, status, retired_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const insertMaint = db.prepare(
      'INSERT INTO maintenance (id, item_id, name, price, date) VALUES (?, ?, ?, ?, ?)'
    )

    for (const item of payload.items) {
      insertItem.run(
        item.id,
        item.ownerId,
        item.name,
        item.price,
        item.purchaseDate,
        item.status ?? 'active',
        item.retiredDate ?? null
      )
      for (const m of item.maintenance ?? []) {
        insertMaint.run(m.id, item.id, m.name, m.price, m.date)
      }
    }

    if (payload.currentView) {
      db.prepare(
        "INSERT INTO settings (key, value) VALUES ('currentView', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run(payload.currentView)
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function getDbInfo() {
  return { path: DB_PATH, type: 'SQLite' }
}
