import { defineConfig } from "vitest/config";

/*
 * separate vitest configuration for integration test coverage
 *
 * integration tests cover:
 * - routes
 * - prisma repositories
 */

export	default	defineConfig({

	test: {

		// tells Vitest which global environment to simulate
		environment: "node",
		// glob pattern that decides which files Vitest treats as test files
		include: ["test/integration/**/*.test.ts"],
		exclude: ["test/integration/**/*.postgres.test.ts"],
		// explicit imports: import { describe, it, expect } from "vitest"
		globals: false,
		// undo vi.spyOn between tests
		restoreMocks: true,
		// clean up global stubs
		unstubGlobals: true,
		// Prisma works better with forked processes
		pool: "forks",
		testTimeout: 10000,
		// configures code coverage reporting (vitest run --coverage)
		coverage: 
		{   // use v8 engine for test coverage
			provider: "v8",
			// which files should be counted when computing coverage
			include: [
				"src/modules/*/*.routes.ts",
				"src/modules/*/*.prismaRepository.ts"
			],
			// which files should be ignored when computing coverage
			exclude: [],
		},
	},
});
