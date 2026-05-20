import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["../tests/**/*.test.ts"],
    // 使用 setup 文件加载 .env
    setupFiles: ["./vitest.setup.ts"],
  },
});