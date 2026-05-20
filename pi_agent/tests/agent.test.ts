/**
 * Agent Module 测试
 * 
 * 测试覆盖：
 * 1. Tools 单元测试 - downloadProgramTool, querySqlTool
 * 2. Config 单元测试 - getEnvConfig, getDefaultSkills
 * 3. Events 单元测试 - 事件转换和订阅
 * 4. Session 集成测试（需要 API Key）
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import dotenv from "dotenv";
import { resolve } from "path";

// 加载 .env 文件（从父目录）
dotenv.config({ path: resolve(__dirname, "../.env") });

// ── 导入新模块 ──────────────────────────────────
import {
  // Tools
  downloadProgramTool,
  querySqlTool,
  
  // Config
  getEnvConfig,
  getDefaultSkills,
  programAnalysisSkill,
  sqlQuerySkill,
  
  // Events
  subscribeToEvents,
  printEvent,
  
  // Session
  createSession,
  
  // Types
  type AgentEvent,
  type AgentConfig,
} from "../agent/index";

// ============================================
// Tools 单元测试
// ============================================

describe("Tools: downloadProgramTool", () => {
  it("应该下载程序（仅必需参数）", async () => {
    const result = await downloadProgramTool.execute(
      "test-call-1",
      { program_name: "ZORDER_CREATE" },
      undefined,  // signal
      undefined,  // onUpdate
      undefined   // ctx
    );

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
    
    const details = result.details as any;
    expect(details.success).toBe(true);
    expect(details.program).toBe("ZORDER_CREATE");
    expect(details.source_file).toContain("ZORDER_CREATE.abap");
  });

  it("应该下载程序及 Include 文件", async () => {
    const result = await downloadProgramTool.execute(
      "test-call-2",
      { program_name: "ZORDER_CREATE", include_includes: true },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.includes).toBeDefined();
    expect(Object.keys(details.includes).length).toBeGreaterThan(0);
  });

  it("应该使用自定义输出目录", async () => {
    const result = await downloadProgramTool.execute(
      "test-call-3",
      { program_name: "ZTEST", output_dir: "/custom/output" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.source_file).toContain("/custom/output");
  });

  it("程序名应该被转为大写", async () => {
    const result = await downloadProgramTool.execute(
      "test-call-4",
      { program_name: "zorder_create" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.program).toBe("ZORDER_CREATE");
  });
});

describe("Tools: querySqlTool", () => {
  it("应该查询表数据（带 WHERE 条件）", async () => {
    const result = await querySqlTool.execute(
      "test-call-5",
      { table: "VBAK", where: "VBELN = '0001234567'" },
      undefined,
      undefined,
      undefined
    );

    expect(result.content).toBeDefined();
    
    const details = result.details as any;
    expect(details.success).toBe(true);
    expect(details.table).toBe("VBAK");
    expect(details.rows).toBeDefined();
    expect(details.count).toBeGreaterThanOrEqual(0);
  });

  it("应该拒绝没有 WHERE 条件的查询", async () => {
    const result = await querySqlTool.execute(
      "test-call-6",
      { table: "VBAK", where: "" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.success).toBe(false);
    expect(details.error).toBe("WHERE_REQUIRED");
    
    // 内容应该包含错误提示
    const text = result.content[0].text;
    expect(text).toContain("WHERE");
  });

  it("应该限制最大行数为 1000", async () => {
    const result = await querySqlTool.execute(
      "test-call-7",
      { table: "VBAK", where: "ERDAT >= '2024-01-01'", limit: 5000 },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.limit).toBe(1000);
  });

  it("应该选择指定字段", async () => {
    const result = await querySqlTool.execute(
      "test-call-8",
      { table: "VBAK", fields: "VBELN,ERDAT", where: "VBELN = '0001234567'" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.columns).toContain("VBELN");
    expect(details.columns).toContain("ERDAT");
  });

  it("表名应该被转为大写", async () => {
    const result = await querySqlTool.execute(
      "test-call-9",
      { table: "vbak", where: "VBELN = '123'" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.table).toBe("VBAK");
  });

  it("字段名应该被转为大写", async () => {
    const result = await querySqlTool.execute(
      "test-call-10",
      { table: "VBAK", fields: "vbeln, erdat", where: "VBELN = '123'" },
      undefined,
      undefined,
      undefined
    );

    const details = result.details as any;
    expect(details.columns).toContain("VBELN");
    expect(details.columns).toContain("ERDAT");
  });
});

// ============================================
// Config 单元测试
// ============================================

// 保存原始环境变量
let originalApiKey: string | undefined;
let originalModel: string | undefined;

describe("Config: getEnvConfig", () => {
  beforeEach(() => {
    // 保存原始值
    originalApiKey = process.env.DEEPSEEK_API_KEY;
    originalModel = process.env.DEEPSEEK_MODEL;
  });

  afterEach(() => {
    // 恢复原始值
    process.env.DEEPSEEK_API_KEY = originalApiKey;
    process.env.DEEPSEEK_MODEL = originalModel;
  });

  it("应该从环境变量读取配置", () => {
    process.env.DEEPSEEK_API_KEY = "test-api-key";
    process.env.DEEPSEEK_MODEL = "deepseek-v4-flash";

    const config = getEnvConfig();

    expect(config.apiKey).toBe("test-api-key");
    expect(config.model).toBe("deepseek-v4-flash");
  });

  it("应该使用默认模型", () => {
    process.env.DEEPSEEK_API_KEY = "test-api-key";
    delete process.env.DEEPSEEK_MODEL;

    const config = getEnvConfig();

    expect(config.model).toBe("deepseek-v4-flash");
  });

  it("应该在缺少 API Key 时抛出错误", () => {
    delete process.env.DEEPSEEK_API_KEY;

    expect(() => getEnvConfig()).toThrow("缺少 DEEPSEEK_API_KEY");
  });
});

describe("Config: getDefaultSkills", () => {
  it("应该返回默认 Skills 数组", () => {
    const skills = getDefaultSkills();

    expect(skills.length).toBe(2);
    expect(skills[0].name).toBe("program-analysis");
    expect(skills[1].name).toBe("sql-query");
  });

  it("每个 Skill 应该有必需属性", () => {
    const skills = getDefaultSkills();

    for (const skill of skills) {
      expect(skill.name).toBeDefined();
      expect(skill.description).toBeDefined();
      expect(skill.filePath).toBeDefined();
      expect(skill.baseDir).toBeDefined();
      expect(skill.sourceInfo).toBeDefined();
      expect(skill.disableModelInvocation).toBeDefined();
    }
  });

  it("programAnalysisSkill 应该有正确的配置", () => {
    expect(programAnalysisSkill.name).toBe("program-analysis");
    expect(programAnalysisSkill.filePath).toContain("program-analysis");
  });

  it("sqlQuerySkill 应该有正确的配置", () => {
    expect(sqlQuerySkill.name).toBe("sql-query");
    expect(sqlQuerySkill.filePath).toContain("sql-query");
  });
});

// ============================================
// Events 单元测试
// ============================================

describe("Events: subscribeToEvents", () => {
  it("应该正确转换 text_delta 事件", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        // 模拟触发事件
        handler({
          type: "message_update",
          assistantMessageEvent: { type: "text_delta", delta: "Hello" },
        });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("text_delta");
    expect((events[0] as any).delta).toBe("Hello");
  });

  it("应该正确转换 tool_execution_start 事件", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        handler({
          type: "tool_execution_start",
          toolName: "download_program",
          args: { program_name: "ZTEST" },
        });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("tool_start");
    expect((events[0] as any).toolName).toBe("download_program");
  });

  it("应该正确转换 tool_execution_end 事件", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        handler({
          type: "tool_execution_end",
          toolName: "query_sql",
          isError: false,
          result: { count: 10 },
        });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("tool_end");
    expect((events[0] as any).toolName).toBe("query_sql");
    expect((events[0] as any).isError).toBe(false);
  });

  it("应该正确转换 agent_end 事件", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        handler({
          type: "agent_end",
          messages: [{ role: "user" }, { role: "assistant" }],
        });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("done");
    expect((events[0] as any).messageCount).toBe(2);
  });

  it("应该正确转换错误事件", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        handler({
          type: "message_end",
          message: { stopReason: "error", errorMessage: "API Error" },
        });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("error");
    expect((events[0] as any).message).toBe("API Error");
  });

  it("应该忽略未处理的事件类型", () => {
    const mockSession = {
      subscribe: vi.fn((handler: Function) => {
        handler({ type: "unknown_event" });
        return () => {};
      }),
    };

    const events: AgentEvent[] = [];
    subscribeToEvents(mockSession as any, (event) => events.push(event));

    expect(events.length).toBe(0);
  });

  it("应该返回 unsubscribe 函数", () => {
    const mockSession = {
      subscribe: vi.fn(() => () => {}),
    };

    const unsubscribe = subscribeToEvents(mockSession as any, () => {});
    expect(unsubscribe).toBeDefined();
    expect(typeof unsubscribe).toBe("function");
  });
});

describe("Events: printEvent", () => {
  it("应该打印 text_delta 事件", () => {
    const event: AgentEvent = { type: "text_delta", delta: "Hello" };
    
    // 捕获 stdout
    const spy = vi.spyOn(process.stdout, "write");
    printEvent(event);
    
    expect(spy).toHaveBeenCalledWith("Hello");
    spy.mockRestore();
  });

  it("应该打印 tool_start 事件", () => {
    const event: AgentEvent = {
      type: "tool_start",
      toolName: "download_program",
      args: { program_name: "ZTEST" },
    };
    
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => logs.push(msg));
    
    printEvent(event);
    
    expect(logs.some(l => l.includes("download_program"))).toBe(true);
    spy.mockRestore();
  });

  it("应该打印 tool_end 事件（成功）", () => {
    const event: AgentEvent = {
      type: "tool_end",
      toolName: "query_sql",
      isError: false,
    };
    
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => logs.push(msg));
    
    printEvent(event);
    
    expect(logs.some(l => l.includes("✅") || l.includes("完成"))).toBe(true);
    spy.mockRestore();
  });

  it("应该打印 tool_end 事件（错误）", () => {
    const event: AgentEvent = {
      type: "tool_end",
      toolName: "query_sql",
      isError: true,
    };
    
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => logs.push(msg));
    
    printEvent(event);
    
    expect(logs.some(l => l.includes("❌") || l.includes("错误"))).toBe(true);
    spy.mockRestore();
  });

  it("应该打印 done 事件", () => {
    const event: AgentEvent = { type: "done", messageCount: 5 };
    
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((msg: string) => logs.push(msg));
    
    printEvent(event);
    
    expect(logs.some(l => l.includes("完成") || l.includes("5"))).toBe(true);
    spy.mockRestore();
  });

  it("应该打印 error 事件", () => {
    const event: AgentEvent = { type: "error", message: "Test error" };
    
    const logs: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((msg: string) => logs.push(msg));
    
    printEvent(event);
    
    expect(logs.some(l => l.includes("Test error"))).toBe(true);
    spy.mockRestore();
  });
});

// ============================================
// Session 集成测试（需要真实 API Key）
// ============================================

describe("Session: createSession", () => {
  // 检查是否有 API Key
  const hasApiKey = Boolean(process.env.DEEPSEEK_API_KEY);

  beforeAll(() => {
    // 设置测试用的 API Key（如果没有）
    if (!hasApiKey) {
      process.env.DEEPSEEK_API_KEY = "test-api-key-for-mock";
    }
  });

  afterAll(() => {
    // 清理测试环境变量
    if (!hasApiKey) {
      delete process.env.DEEPSEEK_API_KEY;
    }
  });

  // 跳过需要真实 API 的测试（除非有真实 Key）
  it.skipIf(!hasApiKey)("应该创建 Agent Session", async () => {
    const { session, dispose } = await createSession();

    expect(session).toBeDefined();
    expect(session.agent).toBeDefined();
    expect(session.prompt).toBeDefined();

    dispose();
  });

  it.skipIf(!hasApiKey)("应该注册自定义工具", async () => {
    const { session, dispose } = await createSession();

    const tools = session.agent.state.tools;
    const toolNames = tools.map((t: any) => t.name);

    expect(toolNames).toContain("download_program");
    expect(toolNames).toContain("query_sql");

    dispose();
  });

  it.skipIf(!hasApiKey)("应该执行简单 prompt", async () => {
    const { session, dispose } = await createSession();

    const events: AgentEvent[] = [];
    const unsubscribe = subscribeToEvents(session, (event) => events.push(event));

    await session.prompt("你好，请回复'测试成功'");

    // 验证事件流
    expect(events.some(e => e.type === "text_delta")).toBe(true);
    expect(events.some(e => e.type === "done")).toBe(true);

    unsubscribe();
    dispose();
  }, 120000); // 120秒超时

  it.skipIf(!hasApiKey)("应该调用 download_program 工具", async () => {
    const { session, dispose } = await createSession();

    const events: AgentEvent[] = [];
    const unsubscribe = subscribeToEvents(session, (event) => events.push(event));

    await session.prompt("下载程序 ZTEST_PROGRAM");

    // 验证工具调用事件
    const toolStartEvents = events.filter(e => e.type === "tool_start");
    const toolEndEvents = events.filter(e => e.type === "tool_end");

    expect(toolStartEvents.some((e: any) => e.toolName === "download_program")).toBe(true);
    expect(toolEndEvents.some((e: any) => e.toolName === "download_program")).toBe(true);

    unsubscribe();
    dispose();
  }, 120000); // 120秒超时

  it.skipIf(!hasApiKey)("应该调用 query_sql 工具", async () => {
    const { session, dispose } = await createSession();

    const events: AgentEvent[] = [];
    const unsubscribe = subscribeToEvents(session, (event) => events.push(event));

    await session.prompt("查询表 VBAK 条件 VBELN = '123'");

    // 验证工具调用事件
    const toolStartEvents = events.filter(e => e.type === "tool_start");

    expect(toolStartEvents.some((e: any) => e.toolName === "query_sql")).toBe(true);

    unsubscribe();
    dispose();
  }, 120000); // 120秒超时
});