# Flue Agent - Simplified Agent Backend

基于 @flue/runtime 的简化版 Agent 后端，使用 DeepSeek 模型提供对话能力。

## 功能特性

- 🚀 **快速部署** - 基于 Flue 框架的轻量级实现
- 🤖 **DeepSeek 集成** - 支持多种 DeepSeek 模型
- 🔗 **Webhook 触发** - 通过 webhook 接收请求
- 💬 **纯文本对话** - 简单的问答交互

## 目录结构

```
flue_agent/
├── .flue/
│   └── agents/
│       └── chat.ts        # Agent 定义
├── .env                   # 环境变量
├── .env.example           # 环境变量示例
├── package.json
└── dist/                  # 编译输出
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-v4-flash
```

### 3. 启动服务

```bash
npx flue dev --target node --env .env
```

服务将在 http://localhost:3583 启动。

## Agent 配置

Agent 定义在 `.flue/agents/chat.ts`：

```typescript
import type { FlueContext } from "@flue/runtime";

export const triggers = { webhook: true };

export default async function ({ init, payload, env }: FlueContext) {
    const harness = await init({ model: env.DEEPSEEK_MODEL });
    const session = await harness.session();

    // 返回纯文本对话响应
    const response = await session.prompt(payload.text);
    return response;
}
```

## API 调用

### Webhook 端点

**POST /webhook/chat**

```bash
curl -X POST http://localhost:3583/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "你好，请介绍一下自己"}'
```

**响应：**

纯文本格式的 AI 回复。

## 与前端集成

前端通过 Vite proxy 转发请求到 Flue Agent：

```typescript
// web/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3583',
        changeOrigin: true,
      }
    }
  }
});
```

前端调用：

```typescript
const response = await fetch('/api/agents/chat/session-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '用户消息' }),
});
```

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| @flue/runtime | ^0.6.2 | Flue 框架运行时 |
| @flue/cli | ^0.6.2 | Flue CLI 工具 |
| valibot | ^1.4.0 | Schema 验证 |

## 与 pi_agent 的区别

| 特性 | flue_agent | pi_agent |
|------|------------|-----------|
| 框架 | @flue/runtime | @earendil-works/pi-ai |
| 工具支持 | 无 | ✅ download_program, query_sql |
| Skills | 无 | ✅ program-analysis, sql-query |
| 事件订阅 | 无 | ✅ SSE 流式事件 |
| SAP 集成 | 无 | ✅ Python CLI |
| 适用场景 | 简单对话 | 复杂任务、工具调用 |

## 相关项目

- [../web/](../web/) - 前端界面
- [../pi_agent/](../pi_agent/) - 完整版 Agent

## 许可证

MIT