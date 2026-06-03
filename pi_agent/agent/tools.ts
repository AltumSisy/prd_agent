/**
 * Agent Custom Tools
 * 
 * 定义 Agent 可调用的工具：
 * 1. download_program - 下载 SAP 程序源代码
 * 2. query_sql - 查询 SAP 表数据
 * 
 * 每个工具包含：
 * - 参数验证（TypeBox schema）
 * - 清晰的描述和示例
 * - 执行逻辑
 */

import { Type } from "@sinclair/typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import * as path from "path";

const execAsync = promisify(exec);

// Python CLI 路径 (相对于 pi_agent 目录)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PI_AGENT_DIR = path.resolve(__dirname, "..");
const CLI_PATH = path.join(PI_AGENT_DIR, "cli.py");

// ============================================
// Tool: Download Program
// ============================================

/**
 * 从 SAP 服务器下载程序源代码
 * 
 * 用途：
 * - 分析产品问题时，下载相关程序
 * - 查看程序逻辑、Include 结构
 * 
 * 返回：
 * - 程序源代码文件路径
 * - 行数统计
 * - Include 文件列表（可选）
 */
export const downloadProgramTool = defineTool({
  name: "download_program",
  label: "Download Program",
  description: `从 SAP 服务器下载程序源代码到本地。

用途：当用户询问产品问题（如"为什么报错"、"这个程序是什么意思"）时，下载相关程序进行分析。

返回：
- source_file: 源代码文件路径
- lines: 行数
- includes: Include 文件列表（如果 include_includes=true）`,

  parameters: Type.Object({
    program_name: Type.String({
      description: "SAP 程序名，如 ZORDER_CREATE, MV45AF0B",
    }),
    output_dir: Type.Optional(Type.String({
      description: "保存目录，默认 ./output",
    })),
    include_includes: Type.Optional(Type.Boolean({
      description: "是否下载 Include 文件，默认 false",
    })),
  }),

  execute: async (_toolCallId, params) => {
    const { program_name, output_dir = "./output", include_includes = false } = params;

    console.log(`[download_program] 开始执行`, {
      program_name,
      output_dir,
      include_includes,
    });

    try {
      // 构建命令参数
      const args = [
        program_name,
        `--output-dir`, output_dir,
        include_includes ? `--include` : "",
        `--format`, `json`,
      ].filter(Boolean);

      console.log(`[download_program] 执行 Python CLI`, {
        cli: CLI_PATH,
        args: args.join(" "),
      });

      // 执行 Python CLI
      const { stdout, stderr } = await execAsync(
        `python "${CLI_PATH}" program ${args.join(" ")}`,
        {
          cwd: PI_AGENT_DIR,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      if (stderr && !stderr.includes("WARNING")) {
        console.error(`[download_program] stderr:`, stderr);
      }

      // 解析 JSON 输出
      const result = JSON.parse(stdout.trim());

      console.log(`[download_program] 执行完成`, {
        program: result.program,
        source_file: result.source_file,
        lines: result.lines,
        includes_count: Object.keys(result.includes || {}).length,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    } catch (error) {
      console.error(`[download_program] 执行失败:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = {
        success: false,
        program: program_name.toUpperCase(),
        source_file: null,
        lines: 0,
        includes: {},
        error: errorMessage,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    }
  },
});

// ============================================
// Tool: Query SQL
// ============================================

/**
 * 查询 SAP 表数据（通过 RFC_READ_TABLE）
 * 
 * 规范：
 * - 只执行 SELECT 查询
 * - 必须带 WHERE 条件（避免全表扫描）
 * - 结果限制 1000 行以内
 * 
 * 用途：
 * - 验证程序分析结论
 * - 检查数据是否正确
 */
export const querySqlTool = defineTool({
  name: "query_sql",
  label: "Query SQL",
  description: `通过 RFC_READ_TABLE 查询 SAP 表数据。

用途：当程序分析显示可能是数据问题时，查询验证。

规范：
- 只执行 SELECT 查询（RFC_READ_TABLE 只支持读取）
- 必须带 WHERE 条件（避免全表扫描影响性能）
- 结果限制 1000 行以内

示例：
- 验证订单数据是否存在
- 检查配置表是否有某条记录`,

  parameters: Type.Object({
    table: Type.String({
      description: "SAP 表名，如 VBAK, VBAP, MARA",
    }),
    fields: Type.Optional(Type.String({
      description: "字段列表（逗号分隔），默认 * 查询所有字段",
    })),
    where: Type.String({
      description: "WHERE 条件（必须提供，避免全表扫描），如 VBELN = '0001234567'",
    }),
    limit: Type.Optional(Type.Number({
      description: "返回行数限制，默认 100，最大 1000",
    })),
  }),

  execute: async (_toolCallId, params) => {
    const { table, fields = "*", where, limit = 100 } = params;

    console.log(`[query_sql] 开始执行`, {
      table,
      fields,
      where,
      limit,
    });

    // 参数验证：必须有 WHERE 条件
    if (!where?.trim()) {
      console.error(`[query_sql] 参数验证失败: 缺少 WHERE 条件`);
      return {
        content: [{
          type: "text",
          text: "❌ 错误：必须提供 WHERE 条件，避免全表扫描。\n\n示例：VBELN = '0001234567'",
        }],
        details: { success: false, error: "WHERE_REQUIRED" },
      };
    }

    // 限制最大行数
    const safeLimit = Math.min(limit, 1000);

    console.log(`[query_sql] 使用限制行数: ${safeLimit}`);

    try {
      // 对 where 条件进行 shell 转义（用双引号包裹，并转义内部双引号）
      const escapeShellArg = (arg: string): string => {
        // 用双引号包裹，转义内部的双引号和反斜杠
        const escaped = arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"${escaped}"`;
      };

      // 构建命令参数
      // 注意：fields 参数需要用引号包裹，避免逗号后的空格被 argparse 解析为新参数
      const args = [
        table,
        `--fields`, escapeShellArg(fields),
        `--where`, escapeShellArg(where),
        `--limit`, String(safeLimit),
        `--format`, `json`,
      ];

      console.log(`[query_sql] 执行 Python CLI`, {
        cli: CLI_PATH,
        args: args.join(" "),
      });

      // 执行 Python CLI
      const { stdout, stderr } = await execAsync(
        `python "${CLI_PATH}" rfcquery ${args.join(" ")}`,
        {
          cwd: PI_AGENT_DIR,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      if (stderr && !stderr.includes("WARNING")) {
        console.error(`[query_sql] stderr:`, stderr);
      }

      // 解析 JSON 输出
      const result = JSON.parse(stdout.trim());

      console.log(`[query_sql] 执行完成`, {
        table: result.table,
        rows_count: result.rows?.length || 0,
        limit: result.limit,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    } catch (error) {
      console.error(`[query_sql] 执行失败:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = {
        success: false,
        table: table.toUpperCase(),
        columns: [],
        rows: [],
        count: 0,
        error: errorMessage,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    }
  },
});

// ============================================
// Export
// ============================================

/**
 * 所有工具列表
 */
export const agentTools = [downloadProgramTool, querySqlTool];