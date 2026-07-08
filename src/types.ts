export type ItemStatus = 'active' | 'retired'
export type ViewScope = 'family' | string

export interface Member {
  id: string
  name: string
  color: string
}

export interface MaintenanceRecord {
  id: string
  name: string
  price: number
  date: string // YYYY-MM-DD
}

export interface Item {
  id: string
  ownerId: string
  name: string
  price: number
  purchaseDate: string // YYYY-MM-DD
  maintenance?: MaintenanceRecord[]
  status?: ItemStatus
  retiredDate?: string
}

export interface ItemStats {
  item: Item
  daysUsed: number
  dailyCost: number
  totalInvested: number
  maintenanceTotal: number
  isActive: boolean
}

export interface CostMilestone {
  targetCost: number
  targetDate: string
  daysNeeded: number
  reached: boolean
}

export interface AppData {
  members: Member[]
  items: Item[]
}

export const FAMILY_VIEW: ViewScope = 'family'
