import type { Item } from '../types'
import { getItemStats, isItemActive } from './calculations'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type ChartView = 'total' | string
export type TimeRange = 'all' | '5y' | '3y' | '1y' | '6m' | '3m' | '1m'

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '5y', label: '5年' },
  { value: '3y', label: '3年' },
  { value: '1y', label: '1年' },
  { value: '6m', label: '6个月' },
  { value: '3m', label: '3个月' },
  { value: '1m', label: '1个月' },
]

export const DEFAULT_TIME_RANGE: TimeRange = '6m'

export interface ChartDataPoint {
  date: string
  label: string
  value: number
}

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

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return startOfDay(d)
}

function subtractYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() - years)
  return startOfDay(d)
}

function getDataStart(items: Item[], view: ChartView): Date {
  if (view === 'total') {
    return items.reduce((min, item) => {
      const d = startOfDay(parseDate(item.purchaseDate))
      return d < min ? d : min
    }, startOfDay(parseDate(items[0].purchaseDate)))
  }
  const item = items.find((i) => i.id === view)
  if (!item) return startOfDay(new Date())
  return startOfDay(parseDate(item.purchaseDate))
}

function getRangeStart(today: Date, range: TimeRange): Date | null {
  switch (range) {
    case 'all':
      return null
    case '5y':
      return subtractYears(today, 5)
    case '3y':
      return subtractYears(today, 3)
    case '1y':
      return subtractYears(today, 1)
    case '6m':
      return subtractMonths(today, 6)
    case '3m':
      return subtractMonths(today, 3)
    case '1m':
      return subtractMonths(today, 1)
  }
}

function formatAxisLabel(date: Date, range: TimeRange): string {
  if (range === '1m' || range === '3m') {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
  if (range === '6m' || range === '1y') {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
  return date.toLocaleDateString('zh-CN', { year: '2-digit', month: 'numeric' })
}

function buildPoint(items: Item[], current: Date, view: ChartView, range: TimeRange): ChartDataPoint {
  const point: ChartDataPoint = {
    date: formatDate(current),
    label: formatAxisLabel(current, range),
    value: 0,
  }

  if (view === 'total') {
    for (const item of items) {
      const purchase = startOfDay(parseDate(item.purchaseDate))
      if (current >= purchase && isItemActive(item, current)) {
        point.value += getItemStats(item, current).dailyCost
      }
    }
  } else {
    const item = items.find((i) => i.id === view)
    if (!item) return point
    const purchase = startOfDay(parseDate(item.purchaseDate))
    if (current >= purchase) {
      point.value = getItemStats(item, current).dailyCost
    }
  }

  return point
}

/** 生成图表数据，支持视图与时间范围筛选 */
export function buildChartData(
  items: Item[],
  view: ChartView = 'total',
  range: TimeRange = DEFAULT_TIME_RANGE
): ChartDataPoint[] {
  if (items.length === 0) return []

  const today = startOfDay(new Date())
  const dataStart = getDataStart(items, view)
  const rangeStart = getRangeStart(today, range)
  const start =
    rangeStart && rangeStart > dataStart ? rangeStart : dataStart

  if (start > today) return [buildPoint(items, today, view, range)]

  const totalDays = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY) + 1
  const maxPoints = range === '1m' ? 31 : range === '3m' ? 45 : 90
  const step = totalDays > maxPoints ? Math.ceil(totalDays / maxPoints) : 1

  const points: ChartDataPoint[] = []
  for (let i = 0; i < totalDays; i += step) {
    const current = new Date(start.getTime() + i * MS_PER_DAY)
    points.push(buildPoint(items, current, view, range))
  }

  const todayStr = formatDate(today)
  if (points[points.length - 1]?.date !== todayStr) {
    points.push(buildPoint(items, today, view, range))
  }

  return points
}

export function getChartLabel(items: Item[], view: ChartView): string {
  if (view === 'total') return '综合日均成本'
  return items.find((i) => i.id === view)?.name ?? '未知物品'
}

export function getTimeRangeLabel(range: TimeRange): string {
  return TIME_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? '全部'
}

export const CHART_COLOR = '#6c8cff'
export const CHART_COLOR_ITEM = '#4ade80'
