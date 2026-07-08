import Summary from '../components/Summary'
import CostChart from '../components/CostChart'
import type { Item } from '../types'

interface CostAnalysisPageProps {
  items: Item[]
  viewLabel: string
  allItems: Item[]
}

export default function CostAnalysisPage({
  items,
  viewLabel,
  allItems,
}: CostAnalysisPageProps) {
  if (allItems.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📊</div>
        <p>还没有数据</p>
        <p>前往「已购物品」添加第一件物品后，即可查看成本分析</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📊</div>
        <p>「{viewLabel}」暂无物品</p>
        <p>切换其他成员查看，或前往「已购物品」添加</p>
      </div>
    )
  }

  return (
    <>
      <Summary items={items} viewLabel={viewLabel} />
      <CostChart items={items} />
    </>
  )
}
