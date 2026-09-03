import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false, // tests share one Neon dev database — keep them sequential
  },
});
