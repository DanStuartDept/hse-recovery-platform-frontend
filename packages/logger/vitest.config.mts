import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
	environment: "node",
	include: ["src/**/*.{js,jsx,ts,tsx}"],
});
