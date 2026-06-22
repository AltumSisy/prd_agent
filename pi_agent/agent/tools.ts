/**
 * Agent Custom Tools
 *
 * 定义 Agent 可调用的工具：
 * 1. download_program - 下载 SAP 程序源代码
 * 2. query_sql - 查询 SAP 表数据
 * 3. download_function - 下载 SAP 函数模块源代码
 * 4. list_function_group - 列出函数组中的所有函数
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
// Tool: Download Function
// ============================================

/**
 * 从 SAP 服务器下载函数模块源代码
 *
 * 用途：
 * - 分析函数逻辑时，下载函数源代码
 * - 查看函数参数定义和函数体
 *
 * 返回：
 * - 函数源代码文件路径
 * - 参数信息（IMPORTING/EXPORTING/CHANGING/TABLES/EXCEPTIONS）
 * - 行数统计
 */
export const downloadFunctionTool = defineTool({
  name: "download_function",
  label: "Download Function",
  description: `从 SAP 服务器下载函数模块源代码到本地。

用途：当用户询问函数逻辑问题（如"这个函数做什么"、"函数参数有哪些"）时，下载相关函数进行分析。

返回：
- source_file: 源代码文件路径
- parameters: 函数参数信息（IMPORTING/EXPORTING/CHANGING/TABLES/EXCEPTIONS）
- lines: 总行数
- body_lines: 函数体行数（不含参数定义）`,

  parameters: Type.Object({
    function_group: Type.String({
      description: "函数组名，如 ZCRM, RFC_READ_TABLE",
    }),
    function_name: Type.String({
      description: "函数名，如 Z_CREATE_CUSTOMER_KNVV, RFC_READ_TABLE",
    }),
    output_dir: Type.Optional(Type.String({
      description: "保存目录，默认 ./output",
    })),
  }),

  execute: async (_toolCallId, params) => {
    const { function_group, function_name, output_dir = "./output" } = params;

    console.log(`[download_function] 开始执行`, {
      function_group,
      function_name,
      output_dir,
    });

    // 参数验证：函数组和函数名不能为空
    if (!function_group?.trim()) {
      console.error(`[download_function] 参数验证失败: 缺少函数组名`);
      return {
        content: [{
          type: "text",
          text: "❌ 错误：必须提供函数组名。\n\n示例：function_group='ZCRM'",
        }],
        details: { success: false, error: "FUNCTION_GROUP_REQUIRED" },
      };
    }

    if (!function_name?.trim()) {
      console.error(`[download_function] 参数验证失败: 缺少函数名`);
      return {
        content: [{
          type: "text",
          text: "❌ 错误：必须提供函数名。\n\n示例：function_name='Z_CREATE_CUSTOMER_KNVV'",
        }],
        details: { success: false, error: "FUNCTION_NAME_REQUIRED" },
      };
    }

    try {
      // 构建命令参数
      const args = [
        function_group,
        function_name,
        `--output-dir`, output_dir,
        `--format`, `json`,
      ];

      console.log(`[download_function] 执行 Python CLI`, {
        cli: CLI_PATH,
        args: args.join(" "),
      });

      // 执行 Python CLI
      const { stdout, stderr } = await execAsync(
        `python "${CLI_PATH}" function ${args.join(" ")}`,
        {
          cwd: PI_AGENT_DIR,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      if (stderr && !stderr.includes("WARNING")) {
        console.error(`[download_function] stderr:`, stderr);
      }

      // 解析 JSON 输出
      const result = JSON.parse(stdout.trim());

      // 检查执行结果
      if (result.success) {
        console.log(`[download_function] 执行成功`, {
          function_group: result.function_group,
          function_name: result.function_name,
          source_file: result.source_file,
          lines: result.lines,
          body_lines: result.body_lines,
          parameters_count: Object.keys(result.parameters || {}).length,
        });
      } else {
        console.error(`[download_function] 执行失败:`, result.error);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    } catch (error) {
      console.error(`[download_function] 执行失败:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = {
        success: false,
        function_group: function_group.toUpperCase(),
        function_name: function_name.toUpperCase(),
        source_file: null,
        lines: 0,
        parameters: {},
        body_lines: 0,
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
// Tool: List Function Group
// ============================================

/**
 * 列出 SAP 函数组中的所有函数模块
 *
 * 用途：
 * - 查看函数组包含哪些函数
 * - 找到相关函数名后下载具体函数分析
 *
 * 返回：
 * - 函数组名
 * - 函数列表
 * - （可选）下载的函数源代码文件路径
 */
export const listFunctionGroupTool = defineTool({
  name: "list_function_group",
  label: "List Function Group",
  description: `列出 SAP 函数组中的所有函数模块，可选择下载所有函数源代码。

用途：当用户想知道某个函数组包含哪些函数时，列出函数列表。

返回：
- function_group: 函数组名
- functions: 函数名列表
- function_modules: 下载的函数文件路径（如果 download_all=true）`,

  parameters: Type.Object({
    function_group: Type.String({
      description: "函数组名，如 ZCRM, ZSD",
    }),
    download_all: Type.Optional(Type.Boolean({
      description: "是否下载所有函数源代码，默认 false（只列出函数名）",
    })),
    output_dir: Type.Optional(Type.String({
      description: "保存目录，默认 ./output（仅当 download_all=true 时使用）",
    })),
  }),

  execute: async (_toolCallId, params) => {
    const { function_group, download_all = false, output_dir = "./output" } = params;

    console.log(`[list_function_group] 开始执行`, {
      function_group,
      download_all,
      output_dir,
    });

    // 参数验证：函数组名不能为空
    if (!function_group?.trim()) {
      console.error(`[list_function_group] 参数验证失败: 缺少函数组名`);
      return {
        content: [{
          type: "text",
          text: "❌ 错误：必须提供函数组名。\n\n示例：function_group='ZCRM'",
        }],
        details: { success: false, error: "FUNCTION_GROUP_REQUIRED" },
      };
    }

    try {
      // 构建命令参数
      const args = [
        function_group,
        `--output-dir`, output_dir,
        download_all ? `--download-all` : "",
        `--format`, `json`,
      ].filter(Boolean);

      console.log(`[list_function_group] 执行 Python CLI`, {
        cli: CLI_PATH,
        args: args.join(" "),
      });

      // 执行 Python CLI
      const { stdout, stderr } = await execAsync(
        `python "${CLI_PATH}" function ${args.join(" ")}`,
        {
          cwd: PI_AGENT_DIR,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      if (stderr && !stderr.includes("WARNING")) {
        console.error(`[list_function_group] stderr:`, stderr);
      }

      // 解析 JSON 输出
      const result = JSON.parse(stdout.trim());

      // 检查执行结果
      if (result.success) {
        console.log(`[list_function_group] 执行成功`, {
          function_group: result.function_group,
          functions_count: result.functions?.length || 0,
          downloaded_count: Object.keys(result.function_modules || {}).length,
        });
      } else {
        console.error(`[list_function_group] 执行失败:`, result.error);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        details: result,
      };
    } catch (error) {
      console.error(`[list_function_group] 执行失败:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = {
        success: false,
        function_group: function_group.toUpperCase(),
        functions: [],
        function_modules: {},
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
export const agentTools = [downloadProgramTool, querySqlTool, downloadFunctionTool, listFunctionGroupTool];