# 物日记

记录买了什么，均摊到每天，看清每件东西的真实花费。

家庭物品购买成本均摊工具：录入已购物品后，按已使用天数自动计算日均成本，支持家庭成员归属、维护追加、报废冻结与成本趋势图表。

## 功能

- **日均成本**：总投入 ÷ 已使用天数（购买当天算第 1 天）
- **追加投入**：手机壳、贴膜等维护费用计入总成本
- **报废管理**：停用后成本冻结，不再计入综合成本
- **家庭成员**：按成员归属查看，支持全家 / 单人切换
- **成本图表**：综合成本趋势、时间范围筛选、按物品查看
- **已购物品**：搜索名称、归属人、维护项；支持编辑
- **数据备份**：设置页导出 / 导入 JSON，SQLite 持久化存储

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + React + TypeScript + Recharts |
| 后端 | Express + Node.js 内置 SQLite |
| 部署 | Docker / docker-compose |

## 快速开始（Docker）

```bash
docker pull <你的DockerHub用户名>/wuriji:latest
```

或使用 docker-compose：

```yaml
services:
  wuriji:
    image: <你的DockerHub用户名>/wuriji:latest
    container_name: wuriji
    ports:
      - "8080:3001"
    volumes:
      - ./data:/data
    environment:
      - NODE_ENV=production
      - DATA_DIR=/data
    restart: unless-stopped
```

启动后访问：**http://localhost:8080**

数据保存在挂载的 `./data` 目录（SQLite 文件 `app.db`）。

## 本地开发

**环境要求**：Node.js 22+

```bash
npm install
npm run dev
```

- 前端：Vite 开发服务器（默认 `http://localhost:5173`）
- 后端 API：`http://localhost:3001`（前端通过代理访问 `/api`）

生产构建与预览：

```bash
npm run build
npm run start
```

## 数据说明

- 默认数据库路径：`data/app.db`（可通过环境变量 `DATA_DIR` 修改）
- API：`GET/PUT /api/state`、`GET /api/info`
- 设置页支持 JSON 导出 / 导入，便于迁移与备份

## CI/CD

推送到 `main` 分支后，GitHub Actions 会自动构建 Docker 镜像并推送到 Docker Hub。

仓库需在 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 说明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |

## 许可证

MIT
