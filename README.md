# Personal Blog

个人博客：React + Vite 前端，Express API，本地 SQLite / 线上 **Cloudflare Workers + D1**。

## 功能概览

- 用户：注册、登录（JWT）、个人中心  
- 文章：发布/编辑/删除、草稿与发布、列表分页、分类与关键词、浏览量、点赞与收藏  

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19、TypeScript、Vite、React Router、Axios、react-markdown |
| 后端 | Express 5、JWT、bcryptjs |
| 本地数据库 | better-sqlite3（`LOCAL_SQLITE_PATH`） |
| 线上 | Cloudflare Workers、`handleAsNodeRequest` + Express、**D1**（SQLite）、静态资源托管 |

## 目录结构

```
personal-blog/
├── frontend/           # Vite 前端（生产构建输出 frontend/dist）
├── src/                # Express 应用（路由、控制器、模型）
│   ├── worker.mjs      # Worker 入口：/api → Express，其余 → 静态资源
│   └── config/db.js    # D1 / 本地 SQLite + Worker env（含 JWT）
├── migrations/         # D1 / 本地 SQLite 建表 SQL
├── scripts/init-db.js  # 初始化本地 .sqlite 文件
├── wrangler.toml       # Worker、D1、资源与兼容性配置
└── package.json
```

## 环境要求

- **Node.js** 建议 18+（Wrangler 4 建议更高版本）
- **Cloudflare** 账号（仅部署线上时需要）

## 本地开发

1. 安装依赖：

   ```bash
   npm install
   npm install --prefix frontend
   ```

2. 复制环境变量并填写（参考 `.env.example`）：

   ```bash
   cp .env.example .env
   ```

   至少配置：`LOCAL_SQLITE_PATH`、`JWT_SECRET`。

3. 初始化本地数据库：

   ```bash
   npm run db:init
   ```

4. 启动：

   - 后端 API：`npm run dev`（默认 `http://localhost:3000`，前缀 `/api`）  
   - 前端：`npm run dev --prefix frontend`（默认 `http://localhost:5173`）  

   生产构建的前端若将 `VITE_API_BASE_URL` 留空，会使用当前站点下的 `/api`；本地开发时 `frontend` 内逻辑会指向 `http://localhost:3000/api`。

## 线上部署（Cloudflare Workers）

1. 安装 Wrangler 并登录：

   ```bash
   npx wrangler login
   ```

2. 创建 D1 数据库（若尚未创建），将返回的 `database_id` 写入 `wrangler.toml` 的 `[[d1_databases]]`，并保持 `database_name` 与下面命令一致。

3. 在**远程** D1 上执行迁移：

   ```bash
   npm run d1:migrate:remote
   ```

4. 配置 **JWT Secret**（勿提交到 Git）：

   ```bash
   node -e "require('dotenv').config({path:'.env'}); const s=process.env.JWT_SECRET; if(!s)process.exit(1); process.stdout.write(s)" | npx wrangler secret put JWT_SECRET
   ```

   或在 Cloudflare 控制台为该 Worker 添加同名 Secret。

5. 构建并部署：

   ```bash
   npm run deploy
   ```

部署成功后，Worker 默认域名为 `https://<wrangler.toml 中 name>.<子域>.workers.dev`（具体以控制台为准）。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地 Express（watch） |
| `npm run build:frontend` | 仅构建前端到 `frontend/dist` |
| `npm run deploy` | 构建前端 + `wrangler deploy` |
| `npm run db:init` | 根据 `migrations/0001_init.sql` 初始化本地 SQLite |
| `npm run d1:migrate:remote` | 对远程 D1 执行 `migrations/0001_init.sql` |
| `npm run d1:migrate:local` | 对本地 Miniflare D1 执行迁移（Wrangler 本地开发时） |
| `npm run pages:dev` | 构建前端后以 Wrangler 本地跑 Worker（便于联调） |

## 健康检查

部署或本地启动后访问：

`GET /api/health`

## 说明

- **`wrangler.toml` 中的 `database_id`** 为个人资源，若开源仓库请勿提交真实 ID；可使用占位符并在本地覆盖。  
- 从中国大陆访问 `*.workers.dev` 可能不稳定，自用可配合 VPN 或主要使用本地开发。  
- 向 GitHub `git push` 若出现 `Connection was reset`，多为网络问题，需在可访问 GitHub 的环境下重试。

## 许可

ISC（见 `package.json`）。
