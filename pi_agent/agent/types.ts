/**
 * Agent Types
 * 
 * 所有类型定义集中在这里，方便维护和复用
 */

import type { AgentSession, Skill } from "@earendil-works/pi-coding-agent";

// ============================================
// 配置类型
// ============================================

/**
 * Agent 配置
 */
export interface AgentConfig {
  /** 工作目录 */
  cwd?: string;
  /** 模型名称，默认 deepseek-v4-flash */
  model?: string;
  /** 额外的 Skills */
  skills?: Skill[];
  /** 是否启用工具确认（危险操作前询问用户） */
  confirmDangerousTools?: boolean;
}

/**
 * 环境配置（从 .env 读取）
 */
export interface EnvConfig {
  apiKey: string;
  model: string;
}

// ============================================
// 事件类型
// ============================================

/**
 * 文本增量事件
 */
export interface TextDeltaEvent {
  type: "text_delta";
  delta: string;
}

/**
 * 工具开始事件
 */
export interface ToolStartEvent {
  type: "tool_start";
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * 工具结束事件
 */
export interface ToolEndEvent {
  type: "tool_end";
  toolName: string;
  isError: boolean;
  result?: unknown;
}

/**
 * Agent 完成事件
 */
export interface AgentDoneEvent {
  type: "done";
  messageCount: number;
}

/**
 * Turn 完成事件（一轮对话结束）
 */
export interface TurnEndEvent {
  type: "turn_end";
  toolResultCount: number;
}

/**
 * 错误事件
 */
export interface ErrorEvent {
  type: "error";
  message: string;
}

/**
 * Agent 事件联合类型
 */
export type AgentEvent =
  | TextDeltaEvent
  | ToolStartEvent
  | ToolEndEvent
  | AgentDoneEvent
  | TurnEndEvent
  | ErrorEvent;

/**
 * 事件处理器
 */
export type AgentEventHandler = (event: AgentEvent) => void;

// ============================================
// 导出类型
// ============================================

export type { AgentSession, Skill };