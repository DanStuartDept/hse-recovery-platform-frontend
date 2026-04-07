import { describe, expect, it } from "vitest";
import {
	clientSchema,
	gtmSchema,
	oneTrustSchema,
	piwikSchema,
	serverSchema,
} from "./schemas";

describe("clientSchema", () => {
	const validInput = {
		cms: { baseURL: "https://cms.hse.ie", apiPath: "/api/v2" },
		environment: "dev" as const,
		siteUrl: "https://dev.hse.ie",
	};

	it("accepts valid input", () => {
		expect(clientSchema.parse(validInput)).toEqual(validInput);
	});

	it("rejects missing cms.baseURL", () => {
		const input = { ...validInput, cms: { baseURL: "", apiPath: "/api/v2" } };
		expect(() => clientSchema.parse(input)).toThrow();
	});

	it("rejects missing cms.apiPath", () => {
		const input = {
			...validInput,
			cms: { baseURL: "https://cms.hse.ie", apiPath: "" },
		};
		expect(() => clientSchema.parse(input)).toThrow();
	});

	it("rejects invalid environment value", () => {
		const input = { ...validInput, environment: "staging" };
		expect(() => clientSchema.parse(input)).toThrow();
	});

	it("rejects invalid siteUrl (not a URL)", () => {
		const input = { ...validInput, siteUrl: "not-a-url" };
		expect(() => clientSchema.parse(input)).toThrow();
	});

	it("accepts all valid environment values", () => {
		for (const env of ["localhost", "dev", "pre-prod", "prod"] as const) {
			const input = { ...validInput, environment: env };
			expect(clientSchema.parse(input).environment).toBe(env);
		}
	});
});

describe("gtmSchema", () => {
	it("accepts a non-empty string", () => {
		expect(gtmSchema.safeParse("GTM-XXXX").success).toBe(true);
	});

	it("returns undefined when input is undefined", () => {
		const result = gtmSchema.safeParse(undefined);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBeUndefined();
	});

	it("rejects an empty string", () => {
		expect(gtmSchema.safeParse("").success).toBe(false);
	});
});

describe("oneTrustSchema", () => {
	it("accepts a non-empty string", () => {
		expect(oneTrustSchema.safeParse("domain-id-123").success).toBe(true);
	});

	it("returns undefined when input is undefined", () => {
		const result = oneTrustSchema.safeParse(undefined);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBeUndefined();
	});

	it("rejects an empty string", () => {
		expect(oneTrustSchema.safeParse("").success).toBe(false);
	});
});

describe("piwikSchema", () => {
	it("accepts both fields present", () => {
		const result = piwikSchema.safeParse({
			containerId: "abc-123",
			containerUrl: "https://hse.piwik.pro",
		});
		expect(result.success).toBe(true);
	});

	it("returns undefined when input is undefined", () => {
		const result = piwikSchema.safeParse(undefined);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBeUndefined();
	});

	it("rejects missing containerUrl", () => {
		const result = piwikSchema.safeParse({ containerId: "abc-123" });
		expect(result.success).toBe(false);
	});

	it("rejects missing containerId", () => {
		const result = piwikSchema.safeParse({
			containerUrl: "https://hse.piwik.pro",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid containerUrl", () => {
		const result = piwikSchema.safeParse({
			containerId: "abc-123",
			containerUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
	});
});

describe("serverSchema", () => {
	it("accepts valid input", () => {
		const input = { previewToken: "token-1", revalidateToken: "token-2" };
		expect(serverSchema.parse(input)).toEqual(input);
	});

	it("rejects missing previewToken", () => {
		expect(() =>
			serverSchema.parse({ previewToken: "", revalidateToken: "token-2" }),
		).toThrow();
	});

	it("rejects missing revalidateToken", () => {
		expect(() =>
			serverSchema.parse({ previewToken: "token-1", revalidateToken: "" }),
		).toThrow();
	});
});
