import { describe, expect, it } from "vitest";
import { CMSPageTypeSchema } from "../core";
import {
	CMSContentPagePropsSchema,
	CMSLandingPagePropsSchema,
	CMSOrganisationListingPagePropsSchema,
} from "./hsebase";

const basePage = {
	id: 1,
	title: "Test",
	meta: {
		slug: "test",
		type: "hsebase.ContentPage",
		locale: "en",
		html_url: "https://example.com/test/",
		detail_url: "https://example.com/api/pages/1/",
		first_published_at: "2024-01-01T00:00:00Z",
		last_published_at: "2024-01-01T00:00:00Z",
		search_description: "",
		parent: null,
	},
	header: [],
	body: [],
};

describe("CMSPageTypeSchema", () => {
	it("accepts all 5 new hsebase page types", () => {
		const validTypes = [
			"hsebase.ContentPage",
			"hsebase.LandingPage",
			"hsebase.CuratedHubPage",
			"hsebase.OrganisationListingPage",
			"hsebase.OrganisationLandingPage",
		];
		for (const type of validTypes) {
			expect(CMSPageTypeSchema.safeParse(type).success).toBe(true);
		}
	});

	it("rejects the 6 old appbase/news types", () => {
		const removedTypes = [
			"appbase.HomePage",
			"appbase.LandingPage",
			"appbase.ContentPage",
			"appbase.SearchPage",
			"news.NewsListingPage",
			"news.NewsContentPage",
		];
		for (const type of removedTypes) {
			expect(CMSPageTypeSchema.safeParse(type).success).toBe(false);
		}
	});
});

describe("CMSContentPagePropsSchema", () => {
	it("accepts a page with side_nav", () => {
		const page = {
			...basePage,
			lead_text: "Some lead text",
			side_nav: [{ title: "Link", url: "/link" }],
		};
		expect(CMSContentPagePropsSchema.safeParse(page).success).toBe(true);
	});

	it("accepts a page without optional fields", () => {
		expect(CMSContentPagePropsSchema.safeParse(basePage).success).toBe(true);
	});
});

describe("CMSLandingPagePropsSchema", () => {
	it("accepts a page with content zones", () => {
		const page = {
			...basePage,
			meta: { ...basePage.meta, type: "hsebase.LandingPage" },
			lead_text: "Landing lead",
			top_content: [],
			bottom_content: [],
		};
		expect(CMSLandingPagePropsSchema.safeParse(page).success).toBe(true);
	});

	it("accepts a page without optional content zones", () => {
		const page = {
			...basePage,
			meta: { ...basePage.meta, type: "hsebase.LandingPage" },
		};
		expect(CMSLandingPagePropsSchema.safeParse(page).success).toBe(true);
	});
});

describe("CMSOrganisationListingPagePropsSchema", () => {
	it("requires organisation_links and organisation_links_count", () => {
		const page = {
			...basePage,
			meta: { ...basePage.meta, type: "hsebase.OrganisationListingPage" },
			organisation_links: [],
			organisation_links_count: 0,
		};
		expect(CMSOrganisationListingPagePropsSchema.safeParse(page).success).toBe(true);
	});

	it("rejects a page missing organisation_links", () => {
		const page = {
			...basePage,
			meta: { ...basePage.meta, type: "hsebase.OrganisationListingPage" },
			organisation_links_count: 0,
		};
		expect(CMSOrganisationListingPagePropsSchema.safeParse(page).success).toBe(false);
	});

	it("rejects a page missing organisation_links_count", () => {
		const page = {
			...basePage,
			meta: { ...basePage.meta, type: "hsebase.OrganisationListingPage" },
			organisation_links: [],
		};
		expect(CMSOrganisationListingPagePropsSchema.safeParse(page).success).toBe(false);
	});
});
