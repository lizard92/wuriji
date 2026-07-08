import type { AppData, ViewScope } from '../types'
import { FAMILY_VIEW } from '../types'
import { normalizeAppData } from '../utils/storage'

export interface ApiState {
  members: AppData['members']
  items: AppData['items']
  currentView?: ViewScope
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || '请求失败')
  }
  return res.json() as Promise<T>
}

export async function fetchState(): Promise<{ data: AppData; currentView: ViewScope }> {
  const raw = await request<ApiState>('/api/state')
  const normalized = normalizeAppData({ members: raw.members, items: raw.items })
  if (!normalized) throw new Error('服务器数据无效')

  let currentView: ViewScope = FAMILY_VIEW
  if (raw.currentView) {
    if (
      raw.currentView === FAMILY_VIEW ||
      normalized.members.some((m) => m.id === raw.currentView)
    ) {
      currentView = raw.currentView
    }
  }

  return { data: normalized, currentView }
}

export async function saveState(data: AppData, currentView: ViewScope): Promise<void> {
  await request('/api/state', {
    method: 'PUT',
    body: JSON.stringify({
      members: data.members,
      items: data.items,
      currentView,
    }),
  })
}

export async function fetchDbInfo(): Promise<{ path: string; type: string }> {
  return request('/api/info')
}
