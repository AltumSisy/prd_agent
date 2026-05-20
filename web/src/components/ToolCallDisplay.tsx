/**
 * ToolCallDisplay 组件
 * 显示工具调用状态的可视化卡片
 */

import { memo } from 'react';

// ============================================
// Types
// ============================================

export type ToolCallStatus = 'running' | 'success' | 'error';

export interface ToolCall {
  toolName: string;
  status: ToolCallStatus;
  args?: Record<string, unknown>;
  error?: string;
  result?: unknown;
}

interface ToolCallDisplayProps {
  toolName: string;
  status: ToolCallStatus;
  args?: Record<string, unknown>;
  error?: string;
  result?: unknown;
}

// ============================================
// Helper: 工具名称映射
// ============================================

const TOOL_NAMES: Record<string, { zh: string; en: string }> = {
  query_sql: { zh: 'SQL 查询', en: 'SQL Query' },
  download_program: { zh: '下载程序', en: 'Download Program' },
  read: { zh: '读取文件', en: 'Read File' },
  bash: { zh: '执行命令', en: 'Run Command' },
};

function getFriendlyToolName(toolName: string): string {
  return TOOL_NAMES[toolName]?.zh || toolName;
}

// ============================================
// Helper: 参数格式化
// ============================================

function formatArgs(args: Record<string, unknown> | undefined): string | null {
  if (!args || Object.keys(args).length === 0) return null;
  
  // 只显示关键参数
  const keyArgs = ['table', 'program', 'file', 'command', 'query'];
  const displayArgs: string[] = [];
  
  for (const [key, value] of Object.entries(args)) {
    if (keyArgs.includes(key)) {
      displayArgs.push(`${key}: ${String(value).slice(0, 50)}`);
    }
  }
  
  return displayArgs.length > 0 ? displayArgs.join(', ') : null;
}

// ============================================
// Component
// ============================================

function ToolCallDisplayComponent({
  toolName,
  status,
  args,
  error,
}: ToolCallDisplayProps) {
  const friendlyName = getFriendlyToolName(toolName);
  const argsDisplay = formatArgs(args);

  // 状态样式
  const statusStyles = {
    running: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  // 状态图标
  const StatusIcon = () => {
    if (status === 'running') {
      return (
        <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }
    if (status === 'success') {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (status === 'error') {
      return (
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return null;
  };

  // 状态文本
  const statusText = {
    running: '执行中...',
    success: '完成',
    error: '失败',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusStyles[status]}`}>
      {/* 状态图标 */}
      <StatusIcon />
      
      {/* 工具名称 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-neutral-700">
            {friendlyName}
          </span>
          <span className="text-xs text-neutral-500">
            {statusText[status]}
          </span>
        </div>
        
        {/* 参数显示 */}
        {argsDisplay && (
          <div className="text-xs text-neutral-500 truncate mt-0.5">
            {argsDisplay}
          </div>
        )}
        
        {/* 错误信息 */}
        {status === 'error' && error && (
          <div className="text-xs text-red-600 mt-1 truncate">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export const ToolCallDisplay = memo(ToolCallDisplayComponent);