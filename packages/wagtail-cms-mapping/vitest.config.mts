import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
	include: ["src/**/*.{js,jsx,ts,tsx}"],
	exclude: ["src/index.tsx", "src/vitest.setup.ts"],
	setupFile: "src/vitest.setup.ts",
});
