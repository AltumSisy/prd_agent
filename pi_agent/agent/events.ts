/**
 * Agent Events
 * 
 * 事件订阅和处理：
 * - 将 AgentSession 事件转换为简化的业务事件
 * - 提供类型安全的事件处理器
 */

import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type { AgentEvent, AgentEventHandler } from "./types";

// ============================================
// 事件转换
// ============================================

/**
 * 创建事件订阅器
 * 
 * 将底层 AgentSession 事件转换为简化的业务事件
 * 
 * @example
 * ```ts
 * const unsubscribe = subscribeToEvents(session, (event) => {
 *   switch (event.type) {
 *     case "text_delta":
 *       process.stdout.write(event.delta);
 *       break;
 *     case "tool_start":
 *       console.log(`[工具] ${event.toolName}`);
 *       break;
 *     case "done":
 *       console.log("完成！");
 *       break;
 *   }
 * });
 * 
 * // 清理
 * unsubscribe();
 * ```
 */
export function subscribeToEvents(
  session: AgentSession,
  handler: AgentEventHandler
): () => void {
  return session.subscribe((rawEvent) => {
    const event = transformEvent(rawEvent);
    if (event) {
      handler(event);
    }
  });
}

/**
 * 转换底层事件为业务事件
 */
function transformEvent(rawEvent: Parameters<Parameters<AgentSession["subscribe"]>[0]>[0]): AgentEvent | null {
  switch (rawEvent.type) {
    // ── 文本流式输出 ─────────────────────────────
    case "message_update": {
      if (rawEvent.assistantMessageEvent.type === "text_delta") {
        return {
          type: "text_delta",
          delta: rawEvent.assistantMessageEvent.delta,
        };
      }
      // thinking_delta 等其他类型暂不处理
      return null;
    }

    // ── 工具调用 ────────────────────────────────
    case "tool_execution_start":
      return {
        type: "tool_start",
        toolName: rawEvent.toolName,
        args: rawEvent.args as Record<string, unknown>,
      };

    case "tool_execution_end":
      return {
        type: "tool_end",
        toolName: rawEvent.toolName,
        isError: rawEvent.isError,
        result: rawEvent.result,
      };

    // ── Agent 完成 ──────────────────────────────
    case "agent_end":
      return {
        type: "done",
        messageCount: rawEvent.messages.length,
      };

    // ── Turn 完成 ────────────────────────────────
    case "turn_end":
      return {
        type: "turn_end",
        toolResultCount: rawEvent.toolResults.length,
      };

    // ── 错误 ────────────────────────────────────
    case "message_end": {
      const msg = rawEvent.message;
      if ("stopReason" in msg && msg.stopReason === "error") {
        return {
          type: "error",
          message: msg.errorMessage ?? "Unknown error",
        };
      }
      return null;
    }

    // 其他事件暂不处理
    default:
      return null;
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 打印事件到控制台（调试用）
 */
export function printEvent(event: AgentEvent): void {
  switch (event.type) {
    case "text_delta":
      process.stdout.write(event.delta);
      break;

    case "tool_start":
      console.log(`\n🔧 [工具] ${event.toolName}`);
      if (Object.keys(event.args).length > 0) {
        console.log(`   参数: ${JSON.stringify(event.args)}`);
      }
      break;

    case "tool_end":
      if (event.isError) {
        console.log(`   ❌ 错误`);
      } else {
        console.log(`   ✅ 完成`);
      }
      break;

    case "done":
      console.log(`\n✨ [完成] 共 ${event.messageCount} 条消息`);
      break;

    case "turn_end":
      if (event.toolResultCount > 0) {
        console.log(`\n📤 [Turn] ${event.toolResultCount} 个工具结果`);
      }
      break;

    case "error":
      console.error(`\n❌ [错误] ${event.message}`);
      break;
  }
}