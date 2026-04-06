import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { describe, expect, it } from "vitest";
import {
	isContentPage,
	isCuratedHubPage,
	isLandingPage,
	isOrganisationLandingPage,
	isOrganisationListingPage,
} from "./index";

function makePage(type: string): CMSPageProps {
	return {
		id: 1,
		title: "Test",
		meta: {
			slug: "test",
			type,
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
	} as CMSPageProps;
}

describe("page type guards", () => {
	const guards = [
		{ fn: isContentPage, type: "hsebase.ContentPage" },
		{ fn: isLandingPage, type: "hsebase.LandingPage" },
		{ fn: isCuratedHubPage, type: "hsebase.CuratedHubPage" },
		{ fn: isOrganisationListingPage, type: "hsebase.OrganisationListingPage" },
		{ fn: isOrganisationLandingPage, type: "hsebase.OrganisationLandingPage" },
	] as const;

	for (const { fn, type } of guards) {
		it(`${fn.name} returns true for ${type}`, () => {
			expect(fn(makePage(type))).toBe(true);
		});

		it(`${fn.name} returns false for other types`, () => {
			const otherType =
				type === "hsebase.ContentPage"
					? "hsebase.LandingPage"
					: "hsebase.ContentPage";
			expect(fn(makePage(otherType))).toBe(false);
		});
	}
});
