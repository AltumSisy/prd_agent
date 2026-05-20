# PI Agent - TypeScript Agent Module

基于 @earendil-works/pi-ai 的 TypeScript Agent 实现，用于 SAP 程序分析与智能问答。

## 功能特性

- 🤖 **智能对话** - 基于 DeepSeek 模型的对话能力
- 🔧 **自定义工具** - download_program, query_sql
- 📚 **Skills 系统** - 程序分析、SQL 查询技能
- 📡 **事件订阅** - 实时获取 Agent 执行状态
- 🔄 **Session 管理** - 多轮对话上下文保持

## 目录结构

```
agent/
├── index.ts           # 模块入口，导出所有 API
├── config.ts          # Agent 配置、Skills 定义
├── session.ts         # Session 创建与管理
├── events.ts          # 事件订阅与处理
├── tools.ts           # 自定义工具定义
├── types.ts           # TypeScript 类型定义
├── skills/            # Skills 目录
│   └── ...            # 技能定义文件
├── output/            # 工具输出目录
└── package.json
```

## 快速开始

### 安装依赖

本项目是 npm workspace 的一部分，在根目录安装：

```bash
cd ../..  # 回到 prd_agent 根目录
npm install
```

### 创建 Session

```typescript
import { createSession, subscribeToEvents, printEvent } from 'pi-agent';

async function main() {
  // 创建 Session
  const { session, dispose } = await createSession();

  // 订阅事件
  const unsubscribe = subscribeToEvents(session, printEvent);

  // 发送消息
  await session.prompt("分析程序 ZSDR079 的逻辑");

  // 清理
  unsubscribe();
  dispose();
}

main();
```

### 使用确认模式

```typescript
import { createSessionWithConfirm } from 'pi-agent';

async function main() {
  const { session, dispose } = await createSessionWithConfirm({
    onToolConfirm: (toolName, args) => {
      console.log(`工具 ${toolName} 将执行:`);
      console.log(JSON.stringify(args, null, 2));
      return confirm('是否继续？');
    }
  });

  await session.prompt("查询订单数据");
  dispose();
}
```

## API 参考

### createSession()

创建 Agent Session。

```typescript
const { session, dispose } = await createSession(options?);
```

**选项：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| confirmTools | boolean | false | 是否在工具执行前确认 |
| onToolConfirm | function | - | 确认回调函数 |

**返回：**

| 字段 | 类型 | 说明 |
|------|------|------|
| session | Session | Agent Session 实例 |
| dispose | () => void | 清理资源 |

### subscribeToEvents()

订阅 Agent 事件。

```typescript
const unsubscribe = subscribeToEvents(session, (event) => {
  console.log(event.type, event);
});
```

**事件类型：**

| 事件 | 说明 |
|------|------|
| text_delta | 文本增量 |
| tool_start | 工具开始执行 |
| tool_end | 工具执行完成 |
| done | Agent 完成 |
| error | 错误 |

### printEvent()

打印事件到控制台（调试用）。

```typescript
subscribeToEvents(session, printEvent);
```

## 自定义工具

### download_program

从 SAP 服务器下载程序源代码。

```typescript
// 工具参数
{
  program_name: string;     // SAP 程序名
  output_dir?: string;      // 保存目录，默认 ./output
  include_includes?: boolean; // 是否下载 Include 文件
}

// 返回
{
  success: boolean;
  program: string;
  source_file: string | null;
  lines: number;
  includes: Record<string, string>;
}
```

### query_sql

通过 RFC_READ_TABLE 查询 SAP 表数据。

```typescript
// 工具参数
{
  table: string;           // SAP 表名
  fields?: string;         // 字段列表，默认 *
  where: string;           // WHERE 条件（必须）
  limit?: number;          // 行数限制，默认 100
}

// 返回
{
  success: boolean;
  table: string;
  columns: string[];
  rows: Record<string, string>[];
  count: number;
}
```

## Skills

### program-analysis

程序分析技能，自动下载并分析 SAP 程序。

### sql-query

SQL 查询技能，用于数据验证和查询。

## 环境变量

在 `../.env` 文件中配置：

```env
# DeepSeek API
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-v4-flash

# SAP 连接（用于 Python CLI）
SAP_HOST=172.18.29.27
SAP_CLIENT=112
SAP_USER=YOUR_USER
SAP_PASSWORD=YOUR_PASSWORD
```

## 与 Server 集成

Agent 模块通过 npm workspace 被 server 引用：

```typescript
// server/src/services/sessionStore.ts
import { createSession, subscribeToEvents } from 'pi-agent';

const { session } = await createSession();
```

## 测试

```bash
npm run test        # 单次运行
npm run test:watch  # 监听模式
```

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| @earendil-works/pi-ai | ^0.75.3 | Agent 框架 |
| @earendil-works/pi-coding-agent | ^0.75.3 | Coding Agent 扩展 |
| @sinclair/typebox | ^0.34.49 | Schema 验证 |
| dotenv | ^17.4.2 | 环境变量 |
| TypeScript | ^5.0 | 类型安全 |

## 相关项目

- [../](../) - Python CLI 工具
- [../../server/](../../server/) - 后端 API 服务

## 许可证

MIT