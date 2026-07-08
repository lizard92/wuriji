import { useState, type FormEvent } from 'react'
import type { Member, ViewScope } from '../types'
import { FAMILY_VIEW } from '../types'

interface MemberSwitcherProps {
  members: Member[]
  currentView: ViewScope
  onViewChange: (view: ViewScope) => void
  onAddMember: (name: string) => void
  onUpdateMember: (id: string, name: string) => void
  onRemoveMember: (id: string) => void
  itemCounts: Record<string, number>
}

export default function MemberSwitcher({
  members,
  currentView,
  onViewChange,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  itemCounts,
}: MemberSwitcherProps) {
  const [showManage, setShowManage] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    onAddMember(newName.trim())
    setNewName('')
  }

  function startEdit(member: Member) {
    setEditingId(member.id)
    setEditName(member.name)
  }

  function saveEdit(id: string) {
    if (editName.trim()) onUpdateMember(id, editName.trim())
    setEditingId(null)
  }

  function handleRemove(id: string, name: string) {
    const count = itemCounts[id] ?? 0
    if (count > 0) {
      window.alert(`「${name}」还有 ${count} 件物品，请先转移或删除后再移除成员`)
      return
    }
    if (members.length <= 1) {
      window.alert('至少保留一名成员')
      return
    }
    if (window.confirm(`确定移除成员「${name}」？`)) {
      onRemoveMember(id)
    }
  }

  return (
    <div className="member-switcher">
      <div className="member-tabs">
        <button
          type="button"
          className={`member-tab ${currentView === FAMILY_VIEW ? 'active' : ''}`}
          onClick={() => onViewChange(FAMILY_VIEW)}
        >
          全家
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`member-tab ${currentView === m.id ? 'active' : ''}`}
            onClick={() => onViewChange(m.id)}
          >
            <span className="member-dot" style={{ background: m.color }} />
            {m.name}
          </button>
        ))}
        <button
          type="button"
          className="member-tab manage"
          onClick={() => setShowManage((v) => !v)}
        >
          {showManage ? '收起' : '管理'}
        </button>
      </div>

      {showManage && (
        <div className="member-manage">
          <div className="member-manage-title">家庭成员</div>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id} className="member-list-item">
                <span className="member-dot" style={{ background: m.color }} />
                {editingId === m.id ? (
                  <input
                    className="member-edit-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(m.id)}
                    autoFocus
                  />
                ) : (
                  <span className="member-list-name">
                    {m.name}
                    <span className="member-list-count">
                      {itemCounts[m.id] ?? 0} 件物品
                    </span>
                  </span>
                )}
                <div className="member-list-actions">
                  {editingId === m.id ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => saveEdit(m.id)}
                    >
                      保存
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => startEdit(m)}
                    >
                      改名
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleRemove(m.id, m.name)}
                  >
                    移除
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <form className="member-add-form" onSubmit={handleAdd}>
            <input
              placeholder="新成员名称，如：妈妈"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              添加成员
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
