import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"]
  },
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "src")}/`,
    },
  },
});
