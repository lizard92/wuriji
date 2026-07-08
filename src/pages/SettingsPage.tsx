import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { fetchDbInfo } from '../api/client'

interface SettingsPageProps {
  memberCount: number
  itemCount: number
  syncing: boolean
  onExport: () => void
  onImport: (json: string) => Promise<boolean>
}

export default function SettingsPage({
  memberCount,
  itemCount,
  syncing,
  onExport,
  onImport,
}: SettingsPageProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [dbInfo, setDbInfo] = useState<{ path: string; type: string } | null>(null)

  useEffect(() => {
    fetchDbInfo().then(setDbInfo).catch(() => setDbInfo(null))
  }, [])

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result
      if (typeof text !== 'string') {
        setImportStatus('error')
        return
      }

      if (
        !window.confirm(
          '导入将覆盖数据库中所有数据（成员、物品、维护记录等），确定继续吗？'
        )
      ) {
        setImportStatus('idle')
        if (fileRef.current) fileRef.current.value = ''
        return
      }

      const ok = await onImport(text)
      setImportStatus(ok ? 'success' : 'error')
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="settings-page">
      <section className="settings-section">
        <h2 className="settings-title">数据存储</h2>
        <p className="settings-desc">
          数据保存在服务器 <strong>SQLite 数据库</strong> 中，换浏览器也能访问同一份数据。
          部署到 NAS 后，数据库文件持久化在磁盘，重启不丢失。
        </p>
        <div className="settings-info">
          <div className="settings-info-row">
            <span>数据库类型</span>
            <code>{dbInfo?.type ?? 'SQLite'}</code>
          </div>
          <div className="settings-info-row">
            <span>数据库路径</span>
            <code className="settings-path">{dbInfo?.path ?? '加载中…'}</code>
          </div>
          <div className="settings-info-row">
            <span>当前数据</span>
            <span>
              {memberCount} 位成员 · {itemCount} 件物品
              {syncing && <span className="settings-syncing"> · 同步中</span>}
            </span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">备份与恢复</h2>
        <p className="settings-desc">
          导出为 JSON 文件备份，可在新环境通过导入恢复。文件包含成员、物品及追加投入等全部记录。
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn-primary settings-btn" onClick={onExport}>
            导出数据
          </button>
          <button
            type="button"
            className="btn btn-primary settings-btn secondary"
            onClick={() => fileRef.current?.click()}
          >
            导入数据
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleImport}
          />
        </div>
        {importStatus === 'success' && (
          <p className="settings-status success">导入成功，数据已写入数据库</p>
        )}
        {importStatus === 'error' && (
          <p className="settings-status error">导入失败，请检查文件格式是否正确</p>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-title">使用提示</h2>
        <ul className="settings-tips">
          <li>NAS Docker 部署时，请挂载 data 目录以持久化数据库</li>
          <li>建议定期导出 JSON 备份，防止误操作</li>
          <li>导入会覆盖数据库现有数据，导入前请先导出当前数据</li>
        </ul>
      </section>
    </div>
  )
}
