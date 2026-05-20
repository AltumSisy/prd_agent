/**
 * Agent Session
 * 
 * 创建 Agent Session 的核心逻辑：
 * - 模型配置
 * - ResourceLoader 设置
 * - Session 创建
 */

import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  AuthStorage,
  ModelRegistry,
  getAgentDir,
} from "@earendil-works/pi-coding-agent";
import { getModel } from "@earendil-works/pi-ai";

import type { AgentConfig } from "./types";
import { getEnvConfig, getDefaultSkills, defaultAgentConfig } from "./config";
import { agentTools } from "./tools";

// ============================================
// Session 创建
// ============================================

/**
 * 创建 Agent Session
 * 
 * @example
 * ```ts
 * // 最简单的方式
 * const { session } = await createSession();
 * 
 * // 自定义配置
 * const { session } = await createSession({
 *   model: "deepseek-v4-pro",
 *   skills: [myCustomSkill],
 * });
 * 
 * // 使用
 * const unsubscribe = subscribeToEvents(session, printEvent);
 * await session.prompt("分析订单创建程序报错的原因");
 * unsubscribe();
 * ```
 */
export async function createSession(config: AgentConfig = {}) {
  // 合合默认配置
  const finalConfig = { ...defaultAgentConfig, ...config };
  const cwd = finalConfig.cwd ?? process.cwd();

  // ── 1. 读取环境配置 ─────────────────────────────
  const envConfig = getEnvConfig();

  // ── 2. 配置 Auth 和 Model ──────────────────────
  const authStorage = AuthStorage.create();
  authStorage.setRuntimeApiKey("deepseek", envConfig.apiKey);

  const modelRegistry = ModelRegistry.create(authStorage);

  // 获取模型（尝试从 registry 查找，或使用内置模型）
  let model = modelRegistry.find("deepseek", envConfig.model);
  
  // 如果找不到，使用默认的 deepseek-v4-flash
  if (!model) {
    model = getModel("deepseek", "deepseek-v4-flash");
  }
  
  if (!model) {
    throw new Error("无法找到 DeepSeek 模型。请检查 DEEPSEEK_API_KEY 配置。");
  }

  // ── 3. 配置 ResourceLoader ─────────────────────
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir: getAgentDir(),
    skillsOverride: (current) => ({
      skills: [
        ...current.skills,
        ...getDefaultSkills(),
        ...finalConfig.skills ?? [],
      ],
      diagnostics: current.diagnostics,
    }),
  });
  await loader.reload();

  // ── 4. 创建 Session ───────────────────────────
  const { session } = await createAgentSession({
    cwd,
    model,
    thinkingLevel: "off",  // DeepSeek V4 Flash 不需要 thinking
    authStorage,
    modelRegistry,
    sessionManager: SessionManager.inMemory(cwd),
    resourceLoader: loader,

    // 自定义工具
    customTools: agentTools,

    // 内置工具 + 自定义工具
    tools: ["read", "bash", "download_program", "query_sql"],
  });

  return {
    session,
    loader,
    /** 清理资源 */
    dispose: () => {
      session.dispose();
    },
  };
}

// ============================================
// 扩展：带确认机制的 Session
// ============================================

/**
 * 创建带工具确认机制的 Session
 * 
 * 危险操作（如 query_sql）执行前会触发确认事件，
 * 前端可以弹出确认对话框让用户决定是否继续。
 * 
 * @example
 * ```ts
 * const { session, confirmTool } = await createSessionWithConfirm();
 * 
 * // 监听确认请求
 * confirmTool.onRequest((request) => {
 *   const ok = await showConfirmDialog(request.toolName, request.args);
 *   confirmTool.respond(request.id, ok);
 * });
 * ```
 * 
 * 注意：目前 createAgentSession 不支持 beforeToolCall，
 * 需要通过 Extension 实现。这里提供接口设计，待后续实现。
 */
export async function createSessionWithConfirm(config: AgentConfig = {}) {
  // TODO: 实现 Extension 的 tool_call 拦截
  // 参考文档：
  // pi.on("tool_call", async (event, ctx) => {
  //   if (event.toolName === "query_sql") {
  //     const ok = await ctx.ui.confirm("确认执行 SQL 查询？", "查询可能耗时较长");
  //     if (!ok) return { block: true, reason: "用户取消" };
  //   }
  // });

  return createSession(config);
}