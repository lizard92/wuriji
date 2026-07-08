import {
  formatMoney,
  getActiveAssets,
  getActiveItems,
  getItemStats,
  getTotalAssets,
  getTotalInvested,
} from '../utils/calculations'
import type { Item } from '../types'

interface SummaryProps {
  items: Item[]
  viewLabel?: string
}

export default function Summary({ items, viewLabel }: SummaryProps) {
  const activeItems = getActiveItems(items)
  const totalDaily = activeItems
    .map((item) => getItemStats(item))
    .reduce((sum, s) => sum + s.dailyCost, 0)
  const totalAssets = getTotalAssets(items)
  const activeAssets = getActiveAssets(items)
  const totalSpent = items.reduce((sum, i) => sum + getTotalInvested(i), 0)
  const retiredCount = items.length - activeItems.length

  if (items.length === 0) return null

  return (
    <div className="summary-card">
      <div className="summary-label">
        综合日均使用成本
        {viewLabel && <span className="summary-scope"> · {viewLabel}</span>}
      </div>
      <div className="summary-value">
        ¥{formatMoney(totalDaily)} <span>/ 天</span>
      </div>
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="summary-stat-label">总资产</span>
          <span className="summary-stat-value">¥{formatMoney(totalAssets)}</span>
          <span className="summary-stat-hint">原价合计</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-label">使用中</span>
          <span className="summary-stat-value">
            {activeItems.length} 件
          </span>
          <span className="summary-stat-hint">¥{formatMoney(activeAssets)}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-label">总投入</span>
          <span className="summary-stat-value">¥{formatMoney(totalSpent)}</span>
          <span className="summary-stat-hint">
            {retiredCount > 0 ? `含 ${retiredCount} 件已报废` : '含维护费用'}
          </span>
        </div>
      </div>
    </div>
  )
}
