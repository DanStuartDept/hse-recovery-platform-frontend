import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function clearEnv() {
	delete process.env.PREVIEW_TOKEN;
	delete process.env.REVALIDATE_TOKEN;
	delete process.env.NODE_ENV;
}

describe("server config — test escape hatch", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
	});

	afterEach(() => {
		clearEnv();
	});

	it("exports stub config when NODE_ENV is test", async () => {
		process.env.NODE_ENV = "test";
		const { serverConfig } = await import("./server");
		expect(serverConfig.previewToken).toBe("");
		expect(serverConfig.revalidateToken).toBe("");
	});
});

describe("server config — validation", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		clearEnv();
	});

	it("returns typed ServerConfig when both tokens are present", async () => {
		process.env.PREVIEW_TOKEN = "preview-secret";
		process.env.REVALIDATE_TOKEN = "revalidate-secret";
		const { serverConfig } = await import("./server");
		expect(serverConfig.previewToken).toBe("preview-secret");
		expect(serverConfig.revalidateToken).toBe("revalidate-secret");
	});

	it("throws when PREVIEW_TOKEN is missing", async () => {
		process.env.REVALIDATE_TOKEN = "revalidate-secret";
		await expect(() => import("./server")).rejects.toThrow();
	});

	it("throws when REVALIDATE_TOKEN is missing", async () => {
		process.env.PREVIEW_TOKEN = "preview-secret";
		await expect(() => import("./server")).rejects.toThrow();
	});

	it("config object is frozen", async () => {
		process.env.PREVIEW_TOKEN = "preview-secret";
		process.env.REVALIDATE_TOKEN = "revalidate-secret";
		const { serverConfig } = await import("./server");
		expect(Object.isFrozen(serverConfig)).toBe(true);
	});
});
