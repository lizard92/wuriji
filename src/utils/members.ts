import type { Item, Member, ViewScope } from '../types'
import { FAMILY_VIEW } from '../types'

export const MEMBER_COLORS = [
  '#6c8cff',
  '#4ade80',
  '#fb923c',
  '#f472b6',
  '#a78bfa',
  '#38bdf8',
  '#facc15',
  '#f87171',
]

export function createMember(name: string, index: number): Member {
  return {
    id: crypto.randomUUID(),
    name,
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  }
}

export function filterItemsByView(items: Item[], view: ViewScope): Item[] {
  if (view === FAMILY_VIEW) return items
  return items.filter((i) => i.ownerId === view)
}

export function getMemberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id)
}

export function getMemberName(members: Member[], ownerId: string): string {
  return getMemberById(members, ownerId)?.name ?? '未知'
}

export function getViewLabel(view: ViewScope, members: Member[]): string {
  if (view === FAMILY_VIEW) return '全家'
  return getMemberName(members, view)
}

export function countItemsByMember(items: Item[], memberId: string): number {
  return items.filter((i) => i.ownerId === memberId).length
}
