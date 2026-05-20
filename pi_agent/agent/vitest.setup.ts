// Vitest setup file
// 在测试运行前加载 .env 文件

import { parse } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
const envParsed = parse(envContent);

// 直接设置 process.env
for (const [key, value] of Object.entries(envParsed)) {
  process.env[key] = value;
}

console.log("[setup] Loaded env:", Object.keys(envParsed).length, "variables");
console.log("[setup] DEEPSEEK_API_KEY:", process.env.DEEPSEEK_API_KEY?.substring(0, 10) + "...");