import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("security headers", () => {
	it("includes all required headers", () => {
		const keys = securityHeaders.map((h) => h.key);
		expect(keys).toContain("Content-Security-Policy");
		expect(keys).toContain("Strict-Transport-Security");
		expect(keys).toContain("X-Content-Type-Options");
		expect(keys).toContain("X-Frame-Options");
		expect(keys).toContain("Referrer-Policy");
		expect(keys).toContain("Permissions-Policy");
	});

	it("has no empty header values", () => {
		for (const header of securityHeaders) {
			expect(header.value.length, `${header.key} has empty value`).toBeGreaterThan(0);
		}
	});
});

describe("content security policy", () => {
	it("includes required directives", () => {
		const required = ["default-src", "script-src", "style-src", "img-src", "connect-src", "frame-ancestors"];
		for (const directive of required) {
			expect(contentSecurityPolicy, `missing directive: ${directive}`).toContain(directive);
		}
	});

	it("does not allow unsafe-eval", () => {
		expect(contentSecurityPolicy).not.toContain("unsafe-eval");
	});

	it("blocks framing via frame-ancestors 'none'", () => {
		expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
	});

	it("has valid directive format", () => {
		const directives = contentSecurityPolicy.split(";").map((d) => d.trim());
		for (const directive of directives) {
			const parts = directive.split(/\s+/);
			expect(parts.length, `directive "${directive}" has no sources`).toBeGreaterThanOrEqual(2);
			expect(parts[0], `"${parts[0]}" is not a valid directive name`).toMatch(/^[a-z][\w-]*$/);
		}
	});

	it("omits GTM domains when NEXT_PUBLIC_GTM_ID is not set", () => {
		expect(contentSecurityPolicy).not.toContain("googletagmanager.com");
	});

	it("omits OneTrust domains when NEXT_PUBLIC_ONETRUST_DOMAIN_ID is not set", () => {
		expect(contentSecurityPolicy).not.toContain("cookielaw.org");
	});

	it("omits Piwik domains when NEXT_PUBLIC_PIWIK_CONTAINER_ID is not set", () => {
		expect(contentSecurityPolicy).not.toContain("piwik.pro");
	});
});
