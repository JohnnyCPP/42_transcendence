import { defineConfig } from "vitest/config";

export	default	defineConfig({

	test: {

		// tells Vitest which global environment to simulate
		environment: "node",
		// glob pattern that decides which files Vitest treats as test files
		include: ["src/**/*.test.ts"],
		// explicit imports: import { describe, it, expect } from "vitest"
		globals: false,
		// undo vi.spyOn between tests
		restoreMocks: true,
		// clean up global stubs
		unstubGlobals: true,
		// configures code coverage reporting (vitest run --coverage)
		coverage: 
		{   // use v8 engine for test coverage
			provider: "v8",
			// which files should be counted when computing coverage
			include: ["src/**/*.ts"],
			// which files should be ignored when computing coverage
			exclude: [
				"src/**/*.test.ts", 
				"src/**/*.types.ts",
				"src/**/*.prismaRepository.ts",
				"src/**/*.routes.ts",
				"src/bootstrap/**/*.ts",
				"src/config/**/*.ts",
				"src/db/**/*.ts",
				"src/shared/errors/*.ts",
				"src/shared/pagination.ts",
				"src/ui/**/*.ts",
				"src/app.ts",
				"src/server.ts"
			],
		},
	},
});
