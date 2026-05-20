/**
 * 测试工具执行
 */

import "dotenv/config";
import { downloadProgramTool, querySqlTool } from "../agent/tools";

async function testDownloadProgram() {
  console.log("\n========================================");
  console.log("测试 download_program 工具");
  console.log("========================================\n");

  try {
    const result = await downloadProgramTool.execute(
      "test-call-1",
      {
        program_name: "ZSDR063",
        output_dir: "./output",
        include_includes: true,
      }
    );

    console.log("\n结果:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("测试失败:", error);
  }
}

async function testQuerySql() {
  console.log("\n========================================");
  console.log("测试 query_sql 工具");
  console.log("========================================\n");

  try {
    const result = await querySqlTool.execute(
      "test-call-2",
      {
        table: "KNA1",
        fields: "KUNNR,NAME1",
        where: "KUNNR = '0000000001'",
        limit: 10,
      }
    );

    console.log("\n结果:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("测试失败:", error);
  }
}

async function main() {
  // 测试 download_program
  // await testDownloadProgram();

  // 测试 query_sql
  await testQuerySql();
}

main().catch(console.error);