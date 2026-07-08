import { useState, type FormEvent } from 'react'
import {
  formatDateDisplay,
  formatMoney,
  getDateForTargetCost,
  getDaysUntil,
  getDefaultMilestones,
  getItemStats,
  getItemStatus,
  getTotalInvested,
  getLastActiveDate,
} from '../utils/calculations'
import type { CostMilestone, Item, MaintenanceRecord, Member } from '../types'
import DateInput from './DateInput'
import { todayString } from '../utils/dateInput'
import { getMemberById } from '../utils/members'

interface ItemCardProps {
  item: Item
  members: Member[]
  showOwner: boolean
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

export default function ItemCard({
  item,
  members,
  showOwner,
  onRemove,
  onUpdate,
  onAddMaintenance,
  onRemoveMaintenance,
  onRetire,
  onRestore,
}: ItemCardProps) {
  const stats = getItemStats(item)
  const isRetired = getItemStatus(item) === 'retired'
  const owner = getMemberById(members, item.ownerId)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPrice, setEditPrice] = useState(String(item.price))
  const [editDate, setEditDate] = useState(item.purchaseDate)
  const [editOwnerId, setEditOwnerId] = useState(item.ownerId)
  const [customTarget, setCustomTarget] = useState('')
  const [customMilestones, setCustomMilestones] = useState<CostMilestone[]>([])
  const [maintName, setMaintName] = useState('')
  const [maintPrice, setMaintPrice] = useState('')
  const [maintDate, setMaintDate] = useState(() => new Date().toISOString().slice(0, 10))

  const endDate = getLastActiveDate(item)
  const totalInvested = getTotalInvested(item, endDate)
  const maintenanceList = item.maintenance ?? []

  const defaultMilestones = getDefaultMilestones(item)
  const defaultMilestone = defaultMilestones[0]
  const extraMilestones = [
    ...defaultMilestones.slice(1),
    ...customMilestones,
  ].sort((a, b) => b.targetCost - a.targetCost)

  function handleAddTarget(e: FormEvent) {
    e.preventDefault()
    const target = parseFloat(customTarget)
    if (!target || target <= 0) return
    const milestone = getDateForTargetCost(item.purchaseDate, totalInvested, target)
    const exists = [...defaultMilestones, ...customMilestones].some(
      (m) => m.targetCost === target
    )
    if (!exists) {
      setCustomMilestones((prev) => [...prev, milestone])
    }
    setCustomTarget('')
  }

  function handleAddMaintenance(e: FormEvent) {
    e.preventDefault()
    const price = parseFloat(maintPrice)
    if (!maintName.trim() || !price || price <= 0 || !maintDate) return
    if (maintDate < item.purchaseDate) return
    onAddMaintenance(item.id, {
      name: maintName.trim(),
      price,
      date: maintDate,
    })
    setMaintName('')
    setMaintPrice('')
    setMaintDate(new Date().toISOString().slice(0, 10))
  }

  function handleRetire() {
    if (window.confirm(`确定将「${item.name}」标记为报废？从今天起不再计入使用中成本。`)) {
      onRetire(item.id)
    }
  }

  function startEdit() {
    setEditName(item.name)
    setEditPrice(String(item.price))
    setEditDate(item.purchaseDate)
    setEditOwnerId(item.ownerId)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    const parsedPrice = parseFloat(editPrice)
    if (!editName.trim() || !parsedPrice || parsedPrice <= 0 || !editDate) return

    const today = todayString()
    if (editDate > today) return

    if (isRetired && item.retiredDate && editDate >= item.retiredDate) {
      window.alert('购买日期必须早于报废日期')
      return
    }

    const earliestMaint = maintenanceList.reduce<string | null>((min, m) => {
      if (!min || m.date < min) return m.date
      return min
    }, null)
    if (earliestMaint && editDate > earliestMaint) {
      window.alert('购买日期不能晚于追加投入记录')
      return
    }

    onUpdate(item.id, {
      name: editName.trim(),
      price: parsedPrice,
      purchaseDate: editDate,
      ownerId: editOwnerId,
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="item-card editing">
        <form className="item-edit-form" onSubmit={handleSaveEdit}>
          <div className="item-edit-title">编辑物品</div>
          <div className="item-edit-grid">
            <input
              placeholder="物品名称"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="购买价格"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              required
            />
          </div>
          <label className="item-edit-date-label">购买日期（年月日）</label>
          <DateInput
            value={editDate}
            onChange={setEditDate}
            max={todayString()}
          />
          <label className="item-edit-date-label">归属人</label>
          <select
            className="form-select item-edit-select"
            value={editOwnerId}
            onChange={(e) => setEditOwnerId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="item-edit-actions">
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={`item-card ${isRetired ? 'retired' : ''}`}>
      <div className="item-main">
        <div className="item-info">
          <div className="item-top">
            <span className="item-name">
              {item.name}
              {showOwner && owner && (
                <span
                  className="item-owner-badge"
                  style={{ borderColor: owner.color, color: owner.color }}
                >
                  {owner.name}
                </span>
              )}
              {isRetired && <span className="item-status-badge">已报废</span>}
            </span>
            <span className="item-daily">
              ¥{formatMoney(stats.dailyCost)}
              <small>/天</small>
            </span>
          </div>
          <div className="item-sub">
            <span>¥{formatMoney(stats.totalInvested)}</span>
            {stats.maintenanceTotal > 0 && (
              <>
                <span className="item-dot">·</span>
                <span className="item-maint-tag">含维护 ¥{formatMoney(stats.maintenanceTotal)}</span>
              </>
            )}
            <span className="item-dot">·</span>
            <span>原价 ¥{formatMoney(item.price)}</span>
            <span className="item-dot">·</span>
            <span>购于 {formatDateDisplay(item.purchaseDate)}</span>
            <span className="item-dot">·</span>
            <span>已用 {stats.daysUsed} 天</span>
            {isRetired && item.retiredDate && (
              <>
                <span className="item-dot">·</span>
                <span className="item-retired-tag">
                  {formatDateDisplay(item.retiredDate)} 起停用
                </span>
              </>
            )}
          </div>
          {!isRetired && defaultMilestone && (
            <div className="item-forecast">
              <MilestoneInline milestone={defaultMilestone} />
            </div>
          )}
        </div>
        <div className="item-actions">
          <button className="btn btn-ghost item-edit" onClick={startEdit} title="编辑">
            编辑
          </button>
          {!isRetired ? (
            <button className="btn btn-ghost item-retire" onClick={handleRetire} title="报废">
              报废
            </button>
          ) : (
            <button className="btn btn-ghost item-restore" onClick={() => onRestore(item.id)} title="恢复使用">
              恢复
            </button>
          )}
          <button
            className="btn btn-ghost item-delete"
            onClick={() => onRemove(item.id)}
            title="删除"
          >
            删除
          </button>
        </div>
      </div>

      {!isRetired && (
        <details className="item-details">
          <summary>
            追加投入
            {maintenanceList.length > 0 && (
              <span className="item-details-badge">{maintenanceList.length}</span>
            )}
          </summary>
          <div className="item-details-body">
            {maintenanceList.length > 0 ? (
              <div className="maintenance-list">
                {maintenanceList.map((m) => (
                  <div key={m.id} className="maintenance-row">
                    <div className="maintenance-info">
                      <span className="maintenance-name">{m.name}</span>
                      <span className="maintenance-meta">
                        ¥{formatMoney(m.price)} · {formatDateDisplay(m.date)}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost maintenance-delete"
                      onClick={() => onRemoveMaintenance(item.id, m.id)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="maintenance-empty">手机壳、贴膜等后续花费记在这里</p>
            )}
            <form className="maintenance-form" onSubmit={handleAddMaintenance}>
              <input
                placeholder="名称，如手机壳"
                value={maintName}
                onChange={(e) => setMaintName(e.target.value)}
                required
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="金额"
                value={maintPrice}
                onChange={(e) => setMaintPrice(e.target.value)}
                required
              />
              <input
                type="date"
                value={maintDate}
                min={item.purchaseDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setMaintDate(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                添加
              </button>
            </form>
          </div>
        </details>
      )}

      {!isRetired && (
        <details className="item-details">
          <summary>成本预测</summary>
          <div className="item-details-body">
            {extraMilestones.length > 0 && (
              <div className="milestone-list">
                {extraMilestones.map((m) => (
                  <MilestoneRow key={m.targetCost} milestone={m} />
                ))}
              </div>
            )}
            <form className="target-form" onSubmit={handleAddTarget}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="自定义目标（元/天）"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                查询
              </button>
            </form>
          </div>
        </details>
      )}
    </div>
  )
}

function MilestoneInline({ milestone }: { milestone: CostMilestone }) {
  const daysLeft = getDaysUntil(milestone.targetDate)

  if (milestone.reached) {
    return (
      <span className="forecast-reached">
        已降至 ¥{formatMoney(milestone.targetCost)}/天
      </span>
    )
  }

  return (
    <span>
      降至 ¥{formatMoney(milestone.targetCost)}/天 → {formatDateDisplay(milestone.targetDate)}
      <span className="forecast-days"> · 还有 {daysLeft} 天</span>
    </span>
  )
}

function MilestoneRow({ milestone }: { milestone: CostMilestone }) {
  const daysLeft = getDaysUntil(milestone.targetDate)

  return (
    <div className={`milestone-row ${milestone.reached ? 'reached' : ''}`}>
      <span className="milestone-cost">¥{formatMoney(milestone.targetCost)}/天</span>
      <span className={`milestone-date ${milestone.reached ? 'reached' : ''}`}>
        {milestone.reached
          ? `✓ ${formatDateDisplay(milestone.targetDate)}`
          : formatDateDisplay(milestone.targetDate)}
      </span>
      {!milestone.reached && (
        <span className="milestone-days">还有 {daysLeft} 天</span>
      )}
    </div>
  )
}
