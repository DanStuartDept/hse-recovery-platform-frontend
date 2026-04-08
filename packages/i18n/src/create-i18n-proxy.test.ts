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

function makeRequest(path: string, options?: { acceptLanguage?: string; cookie?: string }) {
	const url = new URL(path, "http://localhost:3000");
	const headers = new Headers();
	if (options?.acceptLanguage) headers.set("accept-language", options.acceptLanguage);
	const req = new NextRequest(url, { headers });
	if (options?.cookie) req.cookies.set("NEXT_LOCALE", options.cookie);
	return req;
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

	it("uses NEXT_LOCALE cookie over Accept-Language", () => {
		const response = proxy(
			makeRequest("/about/", {
				acceptLanguage: "ga;q=0.9",
				cookie: "en-ie",
			}),
		);
		expect(response).toBeDefined();
		const rewriteHeader = response!.headers.get("x-middleware-rewrite");
		expect(rewriteHeader).toContain("/en-ie/about/");
	});

	it("sets NEXT_LOCALE cookie on response", () => {
		const response = proxy(makeRequest("/ga/about/"));
		const cookie = response!.cookies.get("NEXT_LOCALE");
		expect(cookie?.value).toBe("ga");
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
