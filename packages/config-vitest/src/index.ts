import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const coverageExclusions = [
	"node_modules/",
	"**/node_modules/**",
	"src/test-setup.js",
	"src/vitest.setup.ts",
	"**/*.test.{ts,tsx}",
	"**/*.spec.{ts,tsx}",
	"**/tests/**",
	"**/__tests__/**",
	"**/coverage/**",
	"**/.next/**",
	"**/dist/**",
	"**/build/**",
	"**/storybook-static/**",
	"**/*.config.{js,ts,mjs,mts}",
	"**/*.stories.{ts,tsx,js,jsx,mdx}",
	"**/*.d.ts",
];

interface VitestConfigOptions {
	include?: string[];
	exclude?: string[];
	setupFile?: string;
	environment?: "jsdom" | "node";
}

export function createVitestConfig(options: VitestConfigOptions = {}) {
	const {
		include = [],
		exclude = [],
		setupFile,
		environment = "jsdom",
	} = options;

	const plugins =
		environment === "jsdom" ? [react(), tsconfigPaths()] : [tsconfigPaths()];

	return defineConfig({
		plugins,
		test: {
			environment,
			globals: true,
			passWithNoTests: true,
			setupFiles: setupFile ? [setupFile] : undefined,
			coverage: {
				provider: "v8",
				reporter: ["text", "text-summary", "json", "json-summary", "html", "lcov"],
				include,
				exclude: [...coverageExclusions, ...exclude],
			},
			reporters: [
				"default",
				["json", { outputFile: "coverage/coverage.json" }],
				["vitest-sonar-reporter", { outputFile: "coverage/test-report.xml" }],
				["junit", { outputFile: "coverage/junit.xml" }],
			],
		},
	});
}
