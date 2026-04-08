import type { CMSPageMeta } from "@repo/wagtail-cms-types/core";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { describe, expect, it } from "vitest";
import { generatePageMetadata } from "./generate-page-metadata";

const baseMeta: CMSPageMeta = {
	slug: "about",
	type: "hsebase.ContentPage",
	locale: "en",
	html_url: "https://cms.example.com/about/",
	detail_url: "https://cms.example.com/api/v2/pages/1/",
	first_published_at: "2024-01-01T00:00:00Z",
	last_published_at: "2024-01-01T00:00:00Z",
	search_description: "",
	parent: null,
};

function makePage(
	overrides: { meta?: Partial<CMSPageMeta> } = {},
): CMSPageProps {
	return {
		id: 1,
		title: "About Us",
		breadcrumb: [],
		meta: { ...baseMeta, ...overrides.meta },
	} as CMSPageProps;
}

const defaultOptions = {
	siteUrl: "https://www.hse.ie",
	path: "/about/",
};

describe("generatePageMetadata", () => {
	it("uses seo_title when present", () => {
		const page = makePage({ meta: { seo_title: "Custom SEO Title" } });
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.title).toBe("Custom SEO Title");
	});

	it("falls back to page.title when seo_title is missing", () => {
		const page = makePage();
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.title).toBe("About Us");
	});

	it("falls back to page.title when seo_title is empty", () => {
		const page = makePage({ meta: { seo_title: "" } });
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.title).toBe("About Us");
	});

	it("uses search_description when non-empty", () => {
		const page = makePage({ meta: { search_description: "A page about us." } });
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.description).toBe("A page about us.");
	});

	it("falls back to defaultDescription when search_description is empty", () => {
		const page = makePage();
		const result = generatePageMetadata(page, {
			...defaultOptions,
			defaultDescription: "Default site description",
		});
		expect(result.description).toBe("Default site description");
	});

	it("omits description when both search_description and defaultDescription are empty", () => {
		const page = makePage();
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.description).toBeUndefined();
	});

	it("builds canonical URL from siteUrl and path", () => {
		const page = makePage();
		const result = generatePageMetadata(page, defaultOptions);
		expect(result.alternates?.canonical).toBe("https://www.hse.ie/about/");
	});

	it("builds canonical for homepage", () => {
		const page = makePage();
		const result = generatePageMetadata(page, { ...defaultOptions, path: "/" });
		expect(result.alternates?.canonical).toBe("https://www.hse.ie/");
	});
});
