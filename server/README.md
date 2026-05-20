# PRD Agent Server

基于 Hono 的轻量级后端服务，为前端提供 Agent Chat API。

## 架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Server        │     │   pi_agent      │
│   (Vite/React)  │────▶│   (Hono)        │────▶│   (Agent)       │
│   :5173         │     │   :3000         │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  POST /api/chat/:sid  │  createSession()      │
        │  SSE 流式响应          │  subscribeEvents()    │
        └───────────────────────┴───────────────────────┘
```

## 目录结构

```
server/
├── src/
│   ├── index.ts              # Hono 入口，启动服务器
│   ├── routes/
│   │   └── chat.ts           # Chat API 路由，SSE 流式响应
│   └── services/
│       └── sessionStore.ts   # Agent Session 管理
│
├── tests/
│   ├── unit/
│   │   └── sessionStore.test.ts    # 单元测试
│   └── integration/
│       └── chat.test.ts            # 集成测试
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── TASK.md                   # 开发任务记录
```

## 快速开始

### 安装依赖

本项目使用 npm workspaces，需要在根目录安装：

```bash
cd ../..  # 回到 prd_agent 根目录
npm install
```

### 启动服务器

```bash
cd server
npm run dev
```

服务器启动后：
- 🚀 Server: http://localhost:3000
- 📡 Chat API: POST http://localhost:3000/api/chat/:sessionId
- ❤️ Health: GET http://localhost:3000/health

### 环境变量

服务器从 `../pi_agent/.env` 加载环境变量，需要配置：

```env
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-v4-flash  # 可选
```

## API 文档

### POST /api/chat/:sessionId

发送消息到 Agent，返回 SSE 流式响应。

**请求：**

```json
{
  "text": "用户消息内容"
}
```

**响应：** SSE 流

```
event: text_delta
data: {"delta": "..."}      # 文本增量

event: tool_start
data: {"toolName": "read", "args": {...}}  # 工具开始执行

event: tool_end
data: {"toolName": "read", "isError": false}  # 工具执行完成

event: done
data: {}                    # Agent 完成

event: error
data: {"message": "..."}    # 错误
```

**状态码：**

| 状态码 | 说明 |
|--------|------|
| 200 | SSE 流开始 |
| 400 | 请求格式错误（缺少 text） |
| 429 | Session 正忙（正在处理上一个请求） |

### GET /health

健康检查端点。

**响应：**

```json
{"status": "ok"}
```

## Session 管理

### SessionStore

管理内存中的 Agent Session：

| 功能 | 说明 |
|------|------|
| 创建 Session | 自动调用 pi_agent 的 createSession() |
| 复用 Session | 同一 sessionId 返回同一个 session |
| 过期清理 | 30 分钟无活动自动清理 |
| 并发控制 | 同一 session 只能处理一个请求 |

### Session 生命周期

```
创建 ──▶ 活跃 ──▶ 30分钟无活动 ──▶ 清理
         │
         ▼
       处理请求 (busy=true)
         │
         ▼
       完成 (busy=false)
```

## 测试

### 运行测试

```bash
npm run test        # 监听模式
npm run test:run    # 单次运行
```

### 测试覆盖

| 测试文件 | 测试数 | 覆盖内容 |
|----------|--------|----------|
| sessionStore.test.ts | 12 | Session 创建、获取、过期、并发 |
| chat.test.ts | 7 | API 响应、SSE 流、错误处理 |

### TDD 开发流程

本项目采用测试驱动开发（TDD）：

1. **Red** - 先写测试，运行失败
2. **Green** - 实现代码，测试通过
3. **Refactor** - 优化代码

## 开发指南

### 添加新路由

```typescript
// src/routes/newRoute.ts
import { Hono } from 'hono';

export function newRoute() {
  const app = new Hono();
  
  app.get('/new', (c) => c.json({ message: 'new route' }));
  
  return app;
}

// src/index.ts
import { newRoute } from './routes/newRoute';
app.route('/new', newRoute());
```

### 添加新测试

```typescript
// tests/integration/newRoute.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { newRoute } from '../../src/routes/newRoute';

describe('New Route', () => {
  it('should work', async () => {
    const app = new Hono();
    app.route('/new', newRoute());
    
    const res = await app.request('/new');
    expect(res.status).toBe(200);
  });
});
```

## 部署

### Docker（未来支持）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

### 生产构建

```bash
npm run build    # 编译 TypeScript
npm start        # 运行编译后的代码
```

## 日志

### 日志文件位置

```
server/logs/
├── server.log    # 所有日志
└── error.log     # 错误日志
```

### 日志格式

```
[2026-05-19T12:44:03.030Z] [INFO] [main] Server starting...
[2026-05-19T12:44:03.040Z] [INFO] [main] Server started {"port":3000}
```

### 查看日志

```bash
# 实时查看日志（Linux/Mac）
tail -f logs/server.log

# 实时查看日志（Windows PowerShell）
Get-Content logs\server.log -Wait

# 查看历史日志
cat logs/server.log         # Linux/Mac
type logs\server.log        # Windows
```

### 日志级别

可通过环境变量配置：

```bash
LOG_LEVEL=debug npm run dev  # 显示所有日志
LOG_LEVEL=info npm run dev   # 默认级别
LOG_LEVEL=warn npm run dev   # 只显示警告和错误
```

### 日志内容

| 事件 | 日志级别 | 说明 |
|------|----------|------|
| 服务器启动 | info | 端口信息 |
| 请求接收 | info | sessionId, 消息长度 |
| SSE 事件 | debug | text_delta, tool_start 等 |
| 响应完成 | info | sessionId, 耗时 |
| 错误 | error | 错误详情 |
| Session 清理 | debug | 活动 session 数 |

### 日志清理

自动保留最近 7 天的日志，每天清理旧文件。

---

## 相关项目

- [web/](../web/) - React 前端
- [pi_agent/](../pi_agent/) - Agent 核心逻辑

## License

MIT