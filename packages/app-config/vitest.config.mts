import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
	include: ["src/**/*.ts"],
	exclude: ["src/index.ts"],
	environment: "node",
});
