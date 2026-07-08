import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDbInfo, getState, saveState } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/info', (_req, res) => {
  res.json(getDbInfo())
})

app.get('/api/state', (_req, res) => {
  try {
    res.json(getState())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '读取数据失败' })
  }
})

app.put('/api/state', (req, res) => {
  try {
    const { members, items } = req.body
    if (!Array.isArray(members) || !Array.isArray(items)) {
      res.status(400).json({ error: '数据格式无效' })
      return
    }
    saveState(req.body)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '保存数据失败' })
  }
})

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Database: ${getDbInfo().path}`)
})
