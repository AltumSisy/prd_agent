# PRD Agent - AI Chatbot Platform

AI 聊天机器人平台，支持 SAP 程序分析与智能问答。

## 项目结构

```
prd_agent/
├── web/                    # 前端 (React + Vite + Tailwind)
├── server/                 # 后端 API 服务 (Hono)
├── pi_agent/               # Agent 核心模块
│   ├── agent/              # TypeScript Agent (npm workspace)
│   ├── commands/           # Python CLI 命令
│   └── cli.py              # SAP 程序读取工具
└── flue_agent/             # Flue Agent 后端 (独立部署)
```

## 架构图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Frontend  │     │   Server        │     │   pi_agent      │
│   React + Vite  │────▶│   Hono API      │────▶│   TypeScript    │
│   :5173         │     │   :3000         │     │   Agent         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  POST /api/chat/:sid  │  createSession()      │  Python CLI
        │  SSE 流式响应          │  subscribeEvents()   │  SAP RFC
        └───────────────────────┴───────────────────────┘
```

## 子项目说明

| 项目 | 说明 | 技术栈 |
|------|------|--------|
| [web/](./web/) | 前端界面，聊天 UI | React 18 + Vite 5 + TypeScript + Tailwind CSS |
| [server/](./server/) | 后端 API 服务，SSE 流式响应 | Hono + TypeScript |
| [pi_agent/](./pi_agent/) | Agent 核心模块 | TypeScript + Python |
| [pi_agent/agent/](./pi_agent/agent/) | TypeScript Agent 实现 | @earendil-works/pi-ai |
| [flue_agent/](./flue_agent/) | 简化版 Agent 后端 | @flue/runtime + DeepSeek |

## 快速开始

### 1. 安装依赖

本项目使用 npm workspaces，在根目录安装所有依赖：

```bash
npm install
```

### 2. 配置环境变量

在 `pi_agent/` 目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-v4-flash

# SAP 连接配置（可选，用于 SAP 工具）
SAP_HOST=yourHost
SAP_CLIENT=yourClient
SAP_USER=YOUR_USER
SAP_PASSWORD=YOUR_PASSWORD
```

### 3. 启动服务

**方式一：启动 Server + pi_agent**

```bash
# 终端 1 - 启动后端服务
cd server && npm run dev

# 终端 2 - 启动前端
cd web && npm run dev
```

访问 http://localhost:5173

**方式二：启动 Flue Agent**

```bash
# 终端 1 - 启动 Flue Agent
cd flue_agent && npx flue dev --target node --env .env

# 终端 2 - 启动前端
cd web && npm run dev
```

## 开发命令

```bash
# 启动前端开发服务器
npm run dev --workspace=web

# 启动后端 API 服务
npm run dev --workspace=server

# 构建
npm run build --workspace=web
npm run build --workspace=server

# 测试
npm run test --workspace=web
npm run test --workspace=server
npm run test --workspace=pi-agent
```

## 技术栈总览

| 类别 | 技术 |
|------|------|
| 前端 | React 18, Vite 5, TypeScript, Tailwind CSS |
| 后端 | Hono, Node.js, TypeScript |
| Agent | @earendil-works/pi-ai, @earendil-works/pi-coding-agent |
| AI 模型 | DeepSeek (deepseek-v4-flash) |
| SAP 集成 | Python, pyrfc |
| 测试 | Vitest |

## 环境要求

- Node.js 20+
- Python 3.12+ (用于 SAP 工具)
- SAP RFC SDK (可选，用于 SAP 连接)

## 许可证

MIT