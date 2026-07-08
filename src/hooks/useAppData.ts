import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData, Item, MaintenanceRecord, ViewScope } from '../types'
import { FAMILY_VIEW } from '../types'
import { fetchState, saveState } from '../api/client'
import { createMember } from '../utils/members'
import { createBackup, downloadBackup, parseBackup, createDefaultData, loadData, loadView, DATA_KEY, LEGACY_ITEMS_KEY } from '../utils/storage'

function tryMigrateLocalStorage(): { data: AppData; currentView: ViewScope } | null {
  const data = loadData()
  const hasLocal =
    data.items.length > 0 ||
    data.members.length > 1 ||
    localStorage.getItem(DATA_KEY) !== null ||
    localStorage.getItem(LEGACY_ITEMS_KEY) !== null
  if (!hasLocal) return null
  return { data, currentView: loadView(data.members) }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(createDefaultData())
  const [currentView, setCurrentView] = useState<ViewScope>(FAMILY_VIEW)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const skipSave = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(async (nextData: AppData, nextView: ViewScope) => {
    setSyncing(true)
    setError(null)
    try {
      await saveState(nextData, nextView)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const remote = await fetchState()
        if (cancelled) return

        const isEmpty =
          remote.data.items.length === 0 && remote.data.members.length <= 1
        const local = isEmpty ? tryMigrateLocalStorage() : null

        if (local) {
          setData(local.data)
          setCurrentView(local.currentView)
          await saveState(local.data, local.currentView)
          localStorage.removeItem(DATA_KEY)
          localStorage.removeItem(LEGACY_ITEMS_KEY)
          localStorage.removeItem('cost-analyzer-view')
        } else {
          setData(remote.data)
          setCurrentView(remote.currentView)
        }
        setError(null)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '无法连接服务器')
        }
      } finally {
        if (!cancelled) {
          skipSave.current = false
          setLoading(false)
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (skipSave.current || loading) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      persist(data, currentView)
    }, 500)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data, currentView, loading, persist])

  const { members, items } = data

  const addItem = useCallback(
    (item: Omit<Item, 'id' | 'maintenance' | 'status' | 'retiredDate'>) => {
      const newItem: Item = {
        ...item,
        id: crypto.randomUUID(),
        maintenance: [],
        status: 'active',
      }
      setData((prev) => ({ ...prev, items: [newItem, ...prev.items] }))
    },
    []
  )

  const removeItem = useCallback((id: string) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }))
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<Omit<Item, 'id'>>) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
  }, [])

  const addMaintenance = useCallback(
    (itemId: string, record: Omit<MaintenanceRecord, 'id'>) => {
      const newRecord: MaintenanceRecord = { ...record, id: crypto.randomUUID() }
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId
            ? { ...i, maintenance: [newRecord, ...(i.maintenance ?? [])] }
            : i
        ),
      }))
    },
    []
  )

  const removeMaintenance = useCallback((itemId: string, recordId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? { ...i, maintenance: (i.maintenance ?? []).filter((m) => m.id !== recordId) }
          : i
      ),
    }))
  }, [])

  const retireItem = useCallback((itemId: string, retiredDate?: string) => {
    const date = retiredDate ?? new Date().toISOString().slice(0, 10)
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, status: 'retired', retiredDate: date } : i
      ),
    }))
  }, [])

  const restoreItem = useCallback((itemId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, status: 'active', retiredDate: undefined } : i
      ),
    }))
  }, [])

  const addMember = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setData((prev) => {
      const member = createMember(trimmed, prev.members.length)
      return { ...prev, members: [...prev.members, member] }
    })
  }, [])

  const updateMember = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, name: trimmed } : m)),
    }))
  }, [])

  const removeMember = useCallback((id: string) => {
    setData((prev) => {
      const hasItems = prev.items.some((i) => i.ownerId === id)
      if (hasItems) return prev
      return { ...prev, members: prev.members.filter((m) => m.id !== id) }
    })
    setCurrentView((view) => (view === id ? FAMILY_VIEW : view))
  }, [])

  const exportData = useCallback(() => {
    downloadBackup(createBackup(data, currentView))
  }, [data, currentView])

  const importData = useCallback(async (json: string): Promise<boolean> => {
    const backup = parseBackup(json)
    if (!backup) return false

    skipSave.current = true
    setData(backup.data)
    const view =
      backup.currentView &&
      (backup.currentView === FAMILY_VIEW ||
        backup.data.members.some((m) => m.id === backup.currentView))
        ? backup.currentView
        : FAMILY_VIEW
    setCurrentView(view)

    try {
      await saveState(backup.data, view)
      setError(null)
      skipSave.current = false
      return true
    } catch {
      skipSave.current = false
      return false
    }
  }, [])

  return {
    members,
    items,
    currentView,
    setCurrentView,
    loading,
    syncing,
    error,
    addItem,
    removeItem,
    updateItem,
    addMaintenance,
    removeMaintenance,
    retireItem,
    restoreItem,
    addMember,
    updateMember,
    removeMember,
    exportData,
    importData,
  }
}
