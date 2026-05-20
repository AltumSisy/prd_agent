# AI Chatbot Landing - Web Frontend

AI 聊天机器人平台前端界面，基于 React 18 + Vite 5 + TypeScript + Tailwind CSS。

## 功能特性

- 🎨 **现代化 UI** - Tailwind CSS 样式，响应式设计
- 💬 **聊天界面** - 实时 SSE 流式响应，支持 Markdown 渲染
- 🔧 **工具调用显示** - 可视化 Agent 工具执行过程
- 🌍 **国际化** - 支持中英文切换
- 📱 **页面导航** - 落地页 + 聊天界面双页面

## 目录结构

```
web/
├── src/
│   ├── App.tsx                # 主应用入口，页面导航
│   ├── main.tsx               # React 入口
│   ├── index.css              # 全局样式
│   ├── components/            # React 组件
│   │   ├── ChatInterface.tsx  # 全屏聊天界面
│   │   ├── ChatPreview.tsx    # 落地页聊天预览
│   │   ├── MarkdownRenderer.tsx # Markdown 渲染器
│   │   ├── ToolCallDisplay.tsx   # 工具调用显示
│   │   ├── StreamingText.tsx     # 流式文本动画
│   │   ├── HeroSection.tsx       # 落地页 Hero 区域
│   │   ├── FeatureCards.tsx      # 功能卡片
│   │   ├── IntegrationLogos.tsx  # 集成 Logo
│   │   └── LanguageSwitch.tsx    # 语言切换
│   ├── hooks/                 # React Hooks
│   └── i18n/                  # 国际化
│       └── TranslationContext.tsx
├── test/                      # 测试文件
├── index.html                 # HTML 模板
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
└── package.json
```

## 快速开始

### 安装依赖

本项目使用 npm workspaces，在根目录安装：

```bash
cd ..  # 回到 prd_agent 根目录
npm install
```

或单独安装：

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## API 集成

前端通过以下 API 与后端通信：

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
data: {"delta": "..."}

event: tool_start
data: {"toolName": "download_program", "args": {...}}

event: tool_end
data: {"toolName": "download_program", "isError": false}

event: done
data: {}
```

## 开发指南

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS utility classes
- 懒加载大型组件 (如 ChatPreview)

### 添加新组件

```tsx
// src/components/NewComponent.tsx
interface NewComponentProps {
  title: string;
}

export function NewComponent({ title }: NewComponentProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {title}
    </div>
  );
}
```

### 国际化

```tsx
import { useTranslation } from '../i18n/TranslationContext';

function MyComponent() {
  const { t } = useTranslation();
  return <span>{t('myKey')}</span>;
}
```

在 `TranslationContext.tsx` 中添加翻译：

```tsx
const translations = {
  en: { myKey: 'Hello' },
  zh: { myKey: '你好' },
};
```

## 测试

```bash
# 监听模式
npm run test

# 单次运行
npm run test:run

# 覆盖率报告
npm run test:coverage
```

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.2 | UI 框架 |
| Vite | 5.0 | 构建工具 |
| TypeScript | 5.0 | 类型安全 |
| Tailwind CSS | 3.4 | 样式框架 |
| react-markdown | 9.0 | Markdown 渲染 |
| eventsource-parser | 3.0 | SSE 解析 |
| Vitest | 4.1 | 测试框架 |

## 相关项目

- [server/](../server/) - 后端 API 服务
- [pi_agent/](../pi_agent/) - Agent 核心模块

## 许可证

MIT