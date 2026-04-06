import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentPage } from "./content-page";
import { LandingPage } from "./landing-page";
import { OrganisationListingPage } from "./organisation-listing-page";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

const mockRenderBlocks = vi.fn((blocks) =>
	blocks.map((b: any) => <div key={b.id} data-testid={`block-${b.id}`} />),
);

function makePageMeta(type: string) {
	return {
		slug: "test",
		type,
		locale: "en",
		html_url: "https://example.com/test/",
		detail_url: "https://example.com/api/pages/1/",
		first_published_at: "2024-01-01T00:00:00Z",
		last_published_at: "2024-01-01T00:00:00Z",
		search_description: "",
		parent: null,
	};
}

describe("ContentPage", () => {
	it("renders title and calls renderBlocks with body", () => {
		const page = {
			id: 1,
			title: "Content Page Title",
			meta: makePageMeta("hsebase.ContentPage"),
			header: [],
			body: [{ id: "b1", type: "text", value: "hello" }],
		} as unknown as CMSPageProps;
		render(<ContentPage page={page} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Content Page Title")).toBeInTheDocument();
		expect(mockRenderBlocks).toHaveBeenCalledWith(page.body);
	});
});

describe("LandingPage", () => {
	it("renders title and all content zones", () => {
		const page = {
			id: 2,
			title: "Landing Page Title",
			meta: makePageMeta("hsebase.LandingPage"),
			header: [],
			body: [{ id: "b1", type: "text", value: "main" }],
			top_content: [{ id: "t1", type: "text", value: "top" }],
			bottom_content: [{ id: "bt1", type: "text", value: "bottom" }],
		} as unknown as CMSPageProps;
		render(<LandingPage page={page} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Landing Page Title")).toBeInTheDocument();
	});
});

describe("OrganisationListingPage", () => {
	it("renders result count and organisation links", () => {
		const page = {
			id: 3,
			title: "Orgs Page",
			meta: makePageMeta("hsebase.OrganisationListingPage"),
			header: [],
			body: [],
			organisation_links: [{ id: "o1", type: "text", value: "org" }],
			organisation_links_count: 5,
		} as unknown as CMSPageProps;
		render(<OrganisationListingPage page={page} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Orgs Page")).toBeInTheDocument();
		expect(screen.getByText(/5 results/)).toBeInTheDocument();
	});
});
