import { useMemo, useState } from 'react'
import ItemForm from '../components/ItemForm'
import ItemCard from '../components/ItemCard'
import { getActiveItems } from '../utils/calculations'
import { getMemberName } from '../utils/members'
import type { Item, MaintenanceRecord, Member } from '../types'

interface MyItemsPageProps {
  items: Item[]
  members: Member[]
  showOwner: boolean
  defaultOwnerId: string
  viewLabel: string
  onAdd: (item: {
    name: string
    price: number
    purchaseDate: string
    ownerId: string
  }) => void
  onRemove: (id: string) => void
  onUpdate: (
    id: string,
    updates: { name: string; price: number; purchaseDate: string; ownerId: string }
  ) => void
  onAddMaintenance: (itemId: string, record: Omit<MaintenanceRecord, 'id'>) => void
  onRemoveMaintenance: (itemId: string, recordId: string) => void
  onRetire: (itemId: string, retiredDate?: string) => void
  onRestore: (itemId: string) => void
}

function matchItem(item: Item, query: string, members: Member[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (item.name.toLowerCase().includes(q)) return true

  const ownerName = getMemberName(members, item.ownerId).toLowerCase()
  if (ownerName.includes(q)) return true

  const hasMaint = (item.maintenance ?? []).some((m) =>
    m.name.toLowerCase().includes(q)
  )
  return hasMaint
}

export default function MyItemsPage({
  items,
  members,
  showOwner,
  defaultOwnerId,
  viewLabel,
  onAdd,
  onRemove,
  onUpdate,
  onAddMaintenance,
  onRemoveMaintenance,
  onRetire,
  onRestore,
}: MyItemsPageProps) {
  const [search, setSearch] = useState('')
  const activeCount = getActiveItems(items).length

  const filteredItems = useMemo(
    () => items.filter((item) => matchItem(item, search, members)),
    [items, search, members]
  )

  const isSearching = search.trim().length > 0

  return (
    <>
      <ItemForm members={members} defaultOwnerId={defaultOwnerId} onAdd={onAdd} />

      <div className="section-title">
        <h2>
          已购物品
          <span className="section-scope">· {viewLabel}</span>
        </h2>
        {items.length > 0 && (
          <span className="item-count">
            {isSearching
              ? `找到 ${filteredItems.length} / ${items.length} 件`
              : `使用中 ${activeCount} / 共 ${items.length} 件`}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="item-search">
          <input
            type="search"
            className="item-search-input"
            placeholder="搜索物品名称、归属人、维护项…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isSearching && (
            <button
              type="button"
              className="btn btn-ghost item-search-clear"
              onClick={() => setSearch('')}
            >
              清除
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <p>「{viewLabel}」还没有物品</p>
          <p>在上方表单中添加，或切换查看其他成员</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <p>没有匹配「{search.trim()}」的物品</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSearch('')}
          >
            清除搜索
          </button>
        </div>
      ) : (
        filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            members={members}
            showOwner={showOwner}
            onRemove={onRemove}
            onUpdate={onUpdate}
            onAddMaintenance={onAddMaintenance}
            onRemoveMaintenance={onRemoveMaintenance}
            onRetire={onRetire}
            onRestore={onRestore}
          />
        ))
      )}
    </>
  )
}
