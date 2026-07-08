import type { CostMilestone, Item, ItemStats } from '../types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getItemStatus(item: Item): 'active' | 'retired' {
  return item.status ?? 'active'
}

/** 某日是否仍在使用中（报废日当天起不再使用） */
export function isItemActive(item: Item, referenceDate = new Date()): boolean {
  if (getItemStatus(item) !== 'retired' || !item.retiredDate) {
    return getItemStatus(item) === 'active'
  }
  return startOfDay(referenceDate) < startOfDay(parseDate(item.retiredDate))
}

/** 计算成本时使用的截止日期（报废前最后一天） */
export function getLastActiveDate(item: Item, referenceDate = new Date()): Date {
  const ref = startOfDay(referenceDate)
  if (getItemStatus(item) === 'retired' && item.retiredDate) {
    const retired = startOfDay(parseDate(item.retiredDate))
    const lastActive = new Date(retired.getTime() - MS_PER_DAY)
    return ref < lastActive ? ref : lastActive
  }
  return ref
}

/** 已使用天数（购买当天算第 1 天） */
export function getDaysUsed(purchaseDate: string, referenceDate = new Date()): number {
  const purchase = startOfDay(parseDate(purchaseDate))
  const end = startOfDay(referenceDate)
  const diff = Math.floor((end.getTime() - purchase.getTime()) / MS_PER_DAY)
  return Math.max(1, diff + 1)
}

/** 截至某日已记录的追加投入总额 */
export function getMaintenanceTotal(item: Item, referenceDate = new Date()): number {
  const ref = startOfDay(referenceDate)
  return (item.maintenance ?? [])
    .filter((m) => startOfDay(parseDate(m.date)) <= ref)
    .reduce((sum, m) => sum + m.price, 0)
}

/** 总投入 = 购买价 + 追加投入 */
export function getTotalInvested(item: Item, referenceDate = new Date()): number {
  return item.price + getMaintenanceTotal(item, referenceDate)
}

/** 总资产：所有物品原价之和 */
export function getTotalAssets(items: Item[]): number {
  return items.reduce((sum, i) => sum + i.price, 0)
}

/** 使用中的物品 */
export function getActiveItems(items: Item[], referenceDate = new Date()): Item[] {
  return items.filter((i) => isItemActive(i, referenceDate))
}

/** 使用中资产：仍在使用的物品原价之和 */
export function getActiveAssets(items: Item[]): number {
  return getActiveItems(items).reduce((sum, i) => sum + i.price, 0)
}

/** 日均成本 = 总投入 / 已使用天数 */
export function getDailyCost(totalInvested: number, daysUsed: number): number {
  return totalInvested / daysUsed
}

export function getItemStats(item: Item, referenceDate = new Date()): ItemStats {
  const isActive = isItemActive(item, referenceDate)
  const endDate = getLastActiveDate(item, referenceDate)
  const daysUsed = getDaysUsed(item.purchaseDate, endDate)
  const maintenanceTotal = getMaintenanceTotal(item, endDate)
  const totalInvested = item.price + maintenanceTotal
  return {
    item,
    daysUsed,
    totalInvested,
    maintenanceTotal,
    isActive,
    dailyCost: getDailyCost(totalInvested, daysUsed),
  }
}

/** 当日均成本降至 targetCost 时，需要的总使用天数 */
export function getDaysForTargetCost(totalInvested: number, targetCost: number): number {
  if (targetCost <= 0) return Infinity
  return Math.ceil(totalInvested / targetCost)
}

/** 达到目标日均成本的日期 */
export function getDateForTargetCost(
  purchaseDate: string,
  totalInvested: number,
  targetCost: number
): CostMilestone {
  const daysNeeded = getDaysForTargetCost(totalInvested, targetCost)
  const purchase = parseDate(purchaseDate)
  const target = new Date(purchase.getTime() + (daysNeeded - 1) * MS_PER_DAY)
  const daysUsed = getDaysUsed(purchaseDate)
  return {
    targetCost,
    targetDate: formatDate(target),
    daysNeeded,
    reached: daysUsed >= daysNeeded,
  }
}

const DEFAULT_TARGET_COST = 10

/** 默认目标：日均成本降至 10 元/天 的日期 */
export function getDefaultMilestones(item: Item): CostMilestone[] {
  const endDate = getLastActiveDate(item)
  const totalInvested = getTotalInvested(item, endDate)
  return [getDateForTargetCost(item.purchaseDate, totalInvested, DEFAULT_TARGET_COST)]
}

export function formatMoney(amount: number): string {
  if (amount >= 100) return amount.toFixed(0)
  if (amount >= 10) return amount.toFixed(1)
  return amount.toFixed(2)
}

export function formatDateDisplay(dateStr: string): string {
  const date = parseDate(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getDaysUntil(dateStr: string, referenceDate = new Date()): number {
  const target = startOfDay(parseDate(dateStr))
  const today = startOfDay(referenceDate)
  return Math.max(0, Math.floor((target.getTime() - today.getTime()) / MS_PER_DAY))
}
