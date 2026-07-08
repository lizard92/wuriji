import { useState } from 'react'
import TabNav, { type TabId } from './components/TabNav'
import MemberSwitcher from './components/MemberSwitcher'
import CostAnalysisPage from './pages/CostAnalysisPage'
import MyItemsPage from './pages/MyItemsPage'
import WishlistPage from './pages/WishlistPage'
import SettingsPage from './pages/SettingsPage'
import { useAppData } from './hooks/useAppData'
import { filterItemsByView, getViewLabel } from './utils/members'
import { FAMILY_VIEW } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('analysis')
  const {
    members,
    items,
    currentView,
    setCurrentView,
    loading,
    syncing,
    error,
    addItem,
    removeItem,
    addMaintenance,
    removeMaintenance,
    retireItem,
    restoreItem,
    updateItem,
    addMember,
    updateMember,
    removeMember,
    exportData,
    importData,
  } = useAppData()

  const filteredItems = filterItemsByView(items, currentView)
  const viewLabel = getViewLabel(currentView, members)
  const itemCounts = Object.fromEntries(
    members.map((m) => [m.id, items.filter((i) => i.ownerId === m.id).length])
  )

  const defaultOwnerId =
    currentView !== FAMILY_VIEW ? currentView : members[0]?.id ?? ''

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>正在连接数据库…</p>
      </div>
    )
  }

  if (error && items.length === 0 && members.length <= 1) {
    return (
      <div className="app-error">
        <h2>无法加载数据</h2>
        <p>{error}</p>
        <p className="app-error-hint">请确认后端服务已启动（npm run dev 会同时启动 API）</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="app-error-banner">
          同步失败：{error}
          {syncing && '（重试中…）'}
        </div>
      )}
      {!error && syncing && <div className="app-sync-banner">正在保存到数据库…</div>}

      <header>
        <h1>物日记</h1>
        <p className="subtitle">记录买了什么，均摊到每天，看清每件东西的真实花费</p>
      </header>

      <MemberSwitcher
        members={members}
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddMember={addMember}
        onUpdateMember={updateMember}
        onRemoveMember={removeMember}
        itemCounts={itemCounts}
      />

      <TabNav active={activeTab} onChange={setActiveTab} />

      <main className="page-content">
        {activeTab === 'analysis' && (
          <CostAnalysisPage
            items={filteredItems}
            viewLabel={viewLabel}
            allItems={items}
          />
        )}
        {activeTab === 'items' && (
          <MyItemsPage
            items={filteredItems}
            members={members}
            showOwner={currentView === FAMILY_VIEW}
            defaultOwnerId={defaultOwnerId}
            viewLabel={viewLabel}
            onAdd={addItem}
            onRemove={removeItem}
            onUpdate={updateItem}
            onAddMaintenance={addMaintenance}
            onRemoveMaintenance={removeMaintenance}
            onRetire={retireItem}
            onRestore={restoreItem}
          />
        )}
        {activeTab === 'wishlist' && <WishlistPage />}
        {activeTab === 'settings' && (
          <SettingsPage
            memberCount={members.length}
            itemCount={items.length}
            syncing={syncing}
            onExport={exportData}
            onImport={importData}
          />
        )}
      </main>
    </>
  )
}
