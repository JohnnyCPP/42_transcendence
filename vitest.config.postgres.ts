import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.postgres.test.ts"],
    globals: false,
    restoreMocks: true,
    unstubGlobals: true,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
