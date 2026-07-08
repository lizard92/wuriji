export type TabId = 'analysis' | 'items' | 'wishlist' | 'settings'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'analysis', label: '成本分析' },
  { id: 'items', label: '已购物品' },
  { id: 'wishlist', label: '心愿单' },
  { id: 'settings', label: '设置' },
]

interface TabNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
