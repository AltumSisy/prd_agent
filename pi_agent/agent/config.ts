/**
 * Agent Configuration
 *
 * 集中管理配置:
 * - 环境变量读取
 * - 模型配置
 * - Skills 定义
 */

// 注意: dotenv 加载由调用者负责，不在这里导入
// 这样可以灵活控制 .env 文件的位置

import type { EnvConfig, AgentConfig } from "./types";
import type { Skill, SourceInfo } from "@earendil-works/pi-coding-agent";

// ============================================
// 环境配置
// ============================================

/**
 * 从环境变量读取 DeepSeek 配置
 */
export function getEnvConfig(): EnvConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error(
      "缺少 DEEPSEEK_API_KEY 环境变量。\n" +
      "请在 .env 文件中设置:\n" +
      "  DEEPSEEK_API_KEY=your-api-key\n" +
      "  DEEPSEEK_MODEL=deepseek-v4-flash  # 可选"
    );
  }

  return { apiKey, model };
}

// ============================================
// Skills 定义
// ============================================

/**
 * 程序分析 Skill
 *
 * 规范化 Agent 在分析产品问题时的行为
 */
export const programAnalysisSkill: Skill = {
  name: "program-analysis",
  description: `下载远程 SAP 程序并进行本地分析,支持 SQL 数据验证。
用途:当用户询问产品问题(如"为什么报错"、"这个程序是什么意思")时使用。`,
  filePath: "./skills/program-analysis/SKILL.md",
  baseDir: "./skills/program-analysis",
  sourceInfo: createSourceInfo("project", "project"),
  disableModelInvocation: false,
};

/**
 * SQL 查询 Skill
 *
 * 规范化 Agent 在查询数据库时的行为
 */
export const sqlQuerySkill: Skill = {
  name: "sql-query",
  description: `通过 RFC_READ_TABLE 查询 SAP 表数据，用于验证分析结论。
规范：只执行 SELECT、必须带 WHERE、结果限制 1000 行。`,
  filePath: "./skills/sql-query/SKILL.md",
  baseDir: "./skills/sql-query",
  sourceInfo: createSourceInfo("project", "project"),
  disableModelInvocation: false,
};

/**
 * 输出格式 Skill
 *
 * 规范化 Agent 的输出格式，使用卡片式布局、emoji图标等
 */
export const outputFormatSkill: Skill = {
  name: "output-format",
  description: `规范化输出格式，提升用户阅读体验。使用卡片式布局、emoji图标、行内代码高亮等格式。`,
  filePath: "./skills/output-format/SKILL.md",
  baseDir: "./skills/output-format",
  sourceInfo: createSourceInfo("project", "project"),
  disableModelInvocation: false,
};

/**
 * 获取默认 Skills
 */
export function getDefaultSkills(): Skill[] {
  return [programAnalysisSkill, sqlQuerySkill, outputFormatSkill];
}

/**
 * 创建 SourceInfo(简化版)
 */
function createSourceInfo(source: string, scope: string): SourceInfo {
  return {
    path: "",
    source,
    scope: scope as any,
    origin: "project" as any,
    baseDir: undefined,
  };
}

// ============================================
// 默认配置
// ============================================

/**
 * 默认 Agent 配置
 */
export const defaultAgentConfig: AgentConfig = {
  cwd: process.cwd(),
  model: "deepseek-v4-flash",
  confirmDangerousTools: false,
  skills: [],
};