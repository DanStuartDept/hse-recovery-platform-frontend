import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Helper: sets all required NEXT_PUBLIC_* env vars. */
function setRequiredEnv(overrides: Record<string, string> = {}) {
	const defaults: Record<string, string> = {
		NEXT_PUBLIC_CMS_API_ENDPOINT: "https://cms.hse.ie",
		NEXT_PUBLIC_API_PATH: "/api/v2",
		NEXT_PUBLIC_ENVIRONMENT_NAME: "dev",
		NEXT_PUBLIC_SITEURL: "https://dev.hse.ie",
	};
	for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
		process.env[key] = value;
	}
}

/** Helper: clears all NEXT_PUBLIC_* env vars used by client config. */
function clearEnv() {
	for (const key of [
		"NEXT_PUBLIC_CMS_API_ENDPOINT",
		"NEXT_PUBLIC_API_PATH",
		"NEXT_PUBLIC_ENVIRONMENT_NAME",
		"NEXT_PUBLIC_SITEURL",
		"NEXT_PUBLIC_GTM_ID",
		"NEXT_PUBLIC_ONETRUST_DOMAIN_ID",
		"NEXT_PUBLIC_PIWIK_CONTAINER_ID",
		"NEXT_PUBLIC_PIWIK_CONTAINER_URL",
		"NODE_ENV",
	]) {
		delete process.env[key];
	}
}

describe("client config — test escape hatch", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
	});

	afterEach(() => {
		clearEnv();
	});

	it("exports stub config when NODE_ENV is test", async () => {
		process.env.NODE_ENV = "test";
		const { config } = await import("./client");
		expect(config.cms).toEqual({ baseURL: "", apiPath: "" });
		expect(config.environment).toBe("localhost");
		expect(config.siteUrl).toBe("http://localhost:3000");
		expect(config.isLocalhost).toBe(true);
		expect(config.isProduction).toBe(false);
		expect(config.analyticsEnabled).toBe(false);
	});
});

describe("client config — validation", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		clearEnv();
	});

	it("returns typed AppConfig when all required vars are present", async () => {
		setRequiredEnv();
		const { config } = await import("./client");
		expect(config.cms.baseURL).toBe("https://cms.hse.ie");
		expect(config.cms.apiPath).toBe("/api/v2");
		expect(config.environment).toBe("dev");
		expect(config.siteUrl).toBe("https://dev.hse.ie");
	});

	it("throws when NEXT_PUBLIC_CMS_API_ENDPOINT is missing", async () => {
		setRequiredEnv();
		delete process.env.NEXT_PUBLIC_CMS_API_ENDPOINT;
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("throws when NEXT_PUBLIC_API_PATH is missing", async () => {
		setRequiredEnv();
		delete process.env.NEXT_PUBLIC_API_PATH;
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("throws when NEXT_PUBLIC_ENVIRONMENT_NAME is missing", async () => {
		setRequiredEnv();
		delete process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("throws when NEXT_PUBLIC_ENVIRONMENT_NAME is invalid", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "staging" });
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("throws when NEXT_PUBLIC_SITEURL is missing", async () => {
		setRequiredEnv();
		delete process.env.NEXT_PUBLIC_SITEURL;
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("throws when NEXT_PUBLIC_SITEURL is not a URL", async () => {
		setRequiredEnv({ NEXT_PUBLIC_SITEURL: "not-a-url" });
		await expect(() => import("./client")).rejects.toThrow();
	});

	it("config object is frozen", async () => {
		setRequiredEnv();
		const { config } = await import("./client");
		expect(Object.isFrozen(config)).toBe(true);
	});
});

describe("client config — optional variables", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		clearEnv();
	});

	it("gtmId is undefined when NEXT_PUBLIC_GTM_ID is not set", async () => {
		setRequiredEnv();
		const { config } = await import("./client");
		expect(config.gtmId).toBeUndefined();
	});

	it("gtmId is the value when NEXT_PUBLIC_GTM_ID is set", async () => {
		setRequiredEnv();
		process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
		const { config } = await import("./client");
		expect(config.gtmId).toBe("GTM-XXXX");
	});

	it("oneTrustDomainId is undefined when not set", async () => {
		setRequiredEnv();
		const { config } = await import("./client");
		expect(config.oneTrustDomainId).toBeUndefined();
	});

	it("oneTrustDomainId is the value when set", async () => {
		setRequiredEnv();
		process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_ID = "domain-123";
		const { config } = await import("./client");
		expect(config.oneTrustDomainId).toBe("domain-123");
	});

	it("piwik is undefined when neither Piwik var is set", async () => {
		setRequiredEnv();
		const { config } = await import("./client");
		expect(config.piwik).toBeUndefined();
	});

	it("piwik is undefined when only PIWIK_CONTAINER_ID is set (missing URL)", async () => {
		setRequiredEnv();
		process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID = "abc-123";
		const { config } = await import("./client");
		expect(config.piwik).toBeUndefined();
	});

	it("piwik is populated when both Piwik vars are set", async () => {
		setRequiredEnv();
		process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID = "abc-123";
		process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL = "https://hse.piwik.pro";
		const { config } = await import("./client");
		expect(config.piwik).toEqual({
			containerId: "abc-123",
			containerUrl: "https://hse.piwik.pro",
		});
	});
});

describe("client config — derived helpers", () => {
	beforeEach(() => {
		vi.resetModules();
		clearEnv();
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		clearEnv();
	});

	it("environment localhost → isLocalhost: true, isProduction: false", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "localhost" });
		const { config } = await import("./client");
		expect(config.isLocalhost).toBe(true);
		expect(config.isProduction).toBe(false);
	});

	it("environment prod → isLocalhost: false, isProduction: true", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "prod" });
		const { config } = await import("./client");
		expect(config.isLocalhost).toBe(false);
		expect(config.isProduction).toBe(true);
	});

	it("environment dev with GTM configured → analyticsEnabled: true", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "dev" });
		process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
		const { config } = await import("./client");
		expect(config.analyticsEnabled).toBe(true);
	});

	it("environment localhost with GTM configured → analyticsEnabled: false", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "localhost" });
		process.env.NEXT_PUBLIC_GTM_ID = "GTM-XXXX";
		const { config } = await import("./client");
		expect(config.analyticsEnabled).toBe(false);
	});

	it("environment dev with no analytics vars → analyticsEnabled: false", async () => {
		setRequiredEnv({ NEXT_PUBLIC_ENVIRONMENT_NAME: "dev" });
		const { config } = await import("./client");
		expect(config.analyticsEnabled).toBe(false);
	});
});
