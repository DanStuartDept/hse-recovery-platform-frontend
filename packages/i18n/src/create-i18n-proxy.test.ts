import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { createI18nProxy } from "./create-i18n-proxy";
import type { I18nConfig } from "./types";

const multiLocaleConfig: I18nConfig = {
	defaultLocale: "en-ie",
	locales: ["en-ie", "ga"],
};

const singleLocaleConfig: I18nConfig = {
	defaultLocale: "en-ie",
	locales: ["en-ie"],
};

function makeRequest(path: string, options?: { acceptLanguage?: string }) {
	const url = new URL(path, "http://localhost:3000");
	const headers = new Headers();
	if (options?.acceptLanguage) headers.set("accept-language", options.acceptLanguage);
	return new NextRequest(url, { headers });
}

describe("createI18nProxy — multi-locale", () => {
	const proxy = createI18nProxy(multiLocaleConfig);

	it("rewrites requests without locale prefix to default locale", () => {
		const response = proxy(makeRequest("/about/"));
		expect(response).toBeDefined();
		const rewriteHeader = response!.headers.get("x-middleware-rewrite");
		expect(rewriteHeader).toContain("/en-ie/about/");
	});

	it("redirects when default locale is explicitly in the URL", () => {
		const response = proxy(makeRequest("/en-ie/about/"));
		expect(response).toBeDefined();
		expect(response!.status).toBe(307);
		expect(response!.headers.get("location")).toContain("/about/");
		expect(response!.headers.get("location")).not.toContain("/en-ie/");
	});

	it("passes through for non-default locale in URL", () => {
		const response = proxy(makeRequest("/ga/about/"));
		expect(response).toBeDefined();
		expect(response!.status).toBe(200);
		expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
	});

	it("redirects to preferred locale from Accept-Language", () => {
		const response = proxy(makeRequest("/about/", { acceptLanguage: "ga;q=0.9,en;q=0.5" }));
		expect(response).toBeDefined();
		expect(response!.status).toBe(307);
		expect(response!.headers.get("location")).toContain("/ga/about/");
	});

	it("falls back to default locale when Accept-Language has no match", () => {
		const response = proxy(makeRequest("/about/", { acceptLanguage: "fr;q=0.9" }));
		expect(response).toBeDefined();
		const rewriteHeader = response!.headers.get("x-middleware-rewrite");
		expect(rewriteHeader).toContain("/en-ie/about/");
	});
});

describe("createI18nProxy — single locale", () => {
	const proxy = createI18nProxy(singleLocaleConfig);

	it("rewrites to default locale when no prefix", () => {
		const response = proxy(makeRequest("/about/"));
		const rewriteHeader = response!.headers.get("x-middleware-rewrite");
		expect(rewriteHeader).toContain("/en-ie/about/");
	});

	it("redirects to remove explicit default locale", () => {
		const response = proxy(makeRequest("/en-ie/about/"));
		expect(response!.status).toBe(307);
		expect(response!.headers.get("location")).toContain("/about/");
	});
});
