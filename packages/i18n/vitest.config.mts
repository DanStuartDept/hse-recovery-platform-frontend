import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
	include: ["src/**/*.{ts,tsx}"],
	exclude: ["src/index.ts", "src/vitest.setup.ts"],
	setupFile: "src/vitest.setup.ts",
});
