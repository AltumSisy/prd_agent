# Server 开发任务

## 需求确认

| 项目 | 选择 |
|------|------|
| Session 存储 | 内存 |
| Session 过期 | 30 分钟无活动 |
| 页面刷新 | 保持对话（session 仍在内存中） |
| 并发请求 | 拒绝，返回 429 |
| 部署 | 本地运行（Docker 未来） |
| 认证 | 不做（MVP） |
| 历史记录 | 不做（MVP） |

## 架构

```
前端 (Vite + React)  → 代理 /api  → 后端 (Hono)  → Agent (pi_agent)
     :5173                             :3000
```

## 文件结构

```
server/
├── src/
│   ├── index.ts                  # Hono 入口
│   ├── routes/
│   │   └── chat.ts               # Chat API
│   └── services/
│       └── sessionStore.ts       # Session 管理
│
├── tests/
│   ├── unit/
│   │   └── sessionStore.test.ts
│   └── integration/
│       └── chat.test.ts
│
├── package.json
└── tsconfig.json
```

## API 接口

### POST /api/chat/:sessionId

**Request:**
```json
{ "text": "用户消息" }
```

**Response:** SSE 流

```
event: text_delta
data: {"delta": "..."}

event: tool_start
data: {"toolName": "read", "args": {...}}

event: tool_end
data: {"toolName": "read", "isError": false}

event: done
data: {}

event: error
data: {"message": "..."}
```

## TDD 开发步骤

### 第一阶段：SessionStore
- [x] 1.1 创建项目结构 (package.json, tsconfig.json)
- [x] 1.2 写测试 tests/unit/sessionStore.test.ts
- [x] 1.3 实现 src/services/sessionStore.ts
- [x] 1.4 测试通过

### 第二阶段：Chat API
- [x] 2.1 写测试 tests/integration/chat.test.ts
- [x] 2.2 实现 src/routes/chat.ts
- [x] 2.3 测试通过

### 第三阶段：整合
- [x] 3.1 实现 src/index.ts
- [x] 3.2 配置 web/vite.config.ts 代理
- [x] 3.3 整体测试（服务器启动成功）

### 第四阶段：前端对接
- [x] 4.1 修改 ChatInterface.tsx 事件格式
- [x] 4.2 手动测试完整流程

## 测试结果
- 后端健康检查: ✅ OK
- Chat API SSE 流: ✅ 返回 text_delta 和 done 事件
- 前端代理: ✅ localhost:5173/api → localhost:3000/api

## 测试用例

### SessionStore 单元测试
- ✓ 创建新 session
- ✓ 获取已存在的 session
- ✓ session 30 分钟无活动后过期
- ✓ 更新 lastActiveAt
- ✓ 删除 session
- ✓ 并发请求同一 sessionId（第二个被拒绝）

### Chat API 集成测试
- ✓ POST /api/chat/:sessionId 返回 SSE 流
- ✓ 发送消息后收到 text_delta 事件
- ✓ 发送消息后收到 tool_start/tool_end 事件
- ✓ 发送消息后收到 done 事件
- ✓ 空消息返回 400
- ✓ session 正忙时返回 429
- ✓ agent 错误时返回 error 事件