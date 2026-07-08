import type { AppData, Item, Member, ViewScope } from '../types'
import { FAMILY_VIEW } from '../types'
import { createMember } from './members'

export const DATA_KEY = 'cost-analyzer-data'
export const VIEW_KEY = 'cost-analyzer-view'
export const LEGACY_ITEMS_KEY = 'cost-analyzer-items'
export const BACKUP_VERSION = 1

export interface DataBackup {
  version: number
  exportedAt: string
  data: AppData
  currentView?: ViewScope
}

function normalizeItem(item: Item, defaultOwnerId: string): Item {
  return {
    ...item,
    ownerId: item.ownerId ?? defaultOwnerId,
    maintenance: item.maintenance ?? [],
    status: item.status ?? 'active',
  }
}

export function createDefaultData(): AppData {
  const defaultMember = createMember('我', 0)
  return { members: [defaultMember], items: [] }
}

export function normalizeAppData(raw: AppData): AppData | null {
  if (!raw.members?.length || !Array.isArray(raw.items)) return null
  const defaultOwner = raw.members[0].id
  return {
    members: raw.members,
    items: raw.items.map((item) => normalizeItem(item, defaultOwner)),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      const normalized = normalizeAppData(parsed)
      if (normalized) return normalized
    }
  } catch {
    /* fall through */
  }

  try {
    const legacy = localStorage.getItem(LEGACY_ITEMS_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Item[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const defaultMember = createMember('我', 0)
        return {
          members: [defaultMember],
          items: parsed.map((item) => normalizeItem(item, defaultMember.id)),
        }
      }
    }
  } catch {
    /* ignore */
  }

  return createDefaultData()
}

export function loadView(members: Member[]): ViewScope {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw === FAMILY_VIEW) return FAMILY_VIEW
    if (raw && members.some((m) => m.id === raw)) return raw
  } catch {
    /* ignore */
  }
  return FAMILY_VIEW
}

export function saveData(data: AppData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

export function saveView(view: ViewScope) {
  localStorage.setItem(VIEW_KEY, view)
}

export function createBackup(data: AppData, currentView?: ViewScope): DataBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    currentView,
  }
}

export function parseBackup(json: string): DataBackup | null {
  try {
    const parsed = JSON.parse(json) as DataBackup
    if (!parsed?.data) return null
    const normalized = normalizeAppData(parsed.data)
    if (!normalized) return null
    return { ...parsed, data: normalized }
  } catch {
    return null
  }
}

export function downloadBackup(backup: DataBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `cost-analyzer-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
