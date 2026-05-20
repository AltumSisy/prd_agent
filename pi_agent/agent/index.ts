/**
 * PI Agent Module
 * 
 * 用于创建 SAP 程序分析 Agent，提供：
 * - Custom Tools (download_program, query_sql)
 * - Skills (program-analysis, sql-query)
 * - Session 创建
 * - 事件订阅
 * 
 * @example
 * ```ts
 * import { createSession, subscribeToEvents, printEvent } from "./agent";
 * 
 * async function main() {
 *   // 创建 Session
 *   const { session, dispose } = await createSession();
 * 
 *   // 订阅事件（打印到控制台）
 *   const unsubscribe = subscribeToEvents(session, printEvent);
 * 
 *   // 执行提示
 *   await session.prompt("分析订单创建程序报错的原因");
 * 
 *   // 清理
 *   unsubscribe();
 *   dispose();
 * }
 * 
 * main();
 * ```
 */

// ── Types ──────────────────────────────────────
export type {
  AgentConfig,
  AgentEvent,
  AgentEventHandler,
  TextDeltaEvent,
  ToolStartEvent,
  ToolEndEvent,
  AgentDoneEvent,
  TurnEndEvent,
  ErrorEvent,
} from "./types";

// ── Tools ──────────────────────────────────────
export {
  downloadProgramTool,
  querySqlTool,
  agentTools,
} from "./tools";

// ── Configuration ──────────────────────────────
export {
  getEnvConfig,
  programAnalysisSkill,
  sqlQuerySkill,
  getDefaultSkills,
  defaultAgentConfig,
} from "./config";

// ── Events ──────────────────────────────────────
export {
  subscribeToEvents,
  printEvent,
} from "./events";

// ── Session ─────────────────────────────────────
export {
  createSession,
  createSessionWithConfirm,
} from "./session";