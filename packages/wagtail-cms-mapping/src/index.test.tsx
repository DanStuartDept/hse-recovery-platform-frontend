import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createCMSRenderer } from "./index";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

function makeBlock(type: string, value: unknown = {}): CMSBlockType {
	return { id: `block-${type}`, type: type as CMSBlockType["type"], value };
}

function makePageMeta(type: string) {
	return {
		slug: "test", type, locale: "en",
		html_url: "https://example.com/test/",
		detail_url: "https://example.com/api/pages/1/",
		first_published_at: "2024-01-01T00:00:00Z",
		last_published_at: "2024-01-01T00:00:00Z",
		search_description: "", parent: null,
	};
}

function makePage(type: string, extra: Record<string, unknown> = {}): CMSPageProps {
	return {
		id: 1, title: "Test Page",
		meta: makePageMeta(type) as CMSPageProps["meta"],
		header: [], body: [], ...extra,
	} as CMSPageProps;
}

describe("createCMSRenderer", () => {
	it("returns renderBlock, renderBlocks, and renderPage", () => {
		const renderer = createCMSRenderer();
		expect(renderer.renderBlock).toBeTypeOf("function");
		expect(renderer.renderBlocks).toBeTypeOf("function");
		expect(renderer.renderPage).toBeTypeOf("function");
	});

	it("renderBlocks returns empty array for empty input", () => {
		const { renderBlocks } = createCMSRenderer();
		expect(renderBlocks([])).toEqual([]);
	});

	it("renderBlocks returns empty array for undefined input", () => {
		const { renderBlocks } = createCMSRenderer();
		expect(renderBlocks(undefined as unknown as CMSBlockType[])).toEqual([]);
	});

	it("uses override block component when provided", () => {
		const CustomText = ({ value }: { value: unknown }) => (
			<div data-testid="custom-text">{String(value)}</div>
		);
		const { renderBlock } = createCMSRenderer({
			blocks: { text: CustomText as any },
		});
		const result = renderBlock(makeBlock("text", "hello"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-text")).toBeInTheDocument();
	});

	it("uses override page component when provided", () => {
		const CustomPage = ({ page }: { page: CMSPageProps }) => (
			<div data-testid="custom-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			pages: { "hsebase.ContentPage": CustomPage as any },
		});
		const result = renderPage(makePage("hsebase.ContentPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-page")).toHaveTextContent("Test Page");
	});

	it("uses custom fallbackBlock for unknown block types", () => {
		const CustomFallback = ({ type }: { type: string }) => (
			<div data-testid="custom-fallback">{type}</div>
		);
		const { renderBlock } = createCMSRenderer({
			fallbackBlock: CustomFallback as any,
		});
		const result = renderBlock(makeBlock("unknown_type" as any));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-fallback")).toHaveTextContent("unknown_type");
	});

	it("uses custom fallbackPage for unknown page types", () => {
		const CustomFallback = ({ page }: { page: CMSPageProps }) => (
			<div data-testid="fallback-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			fallbackPage: CustomFallback as any,
		});
		const result = renderPage(makePage("hsebase.UnknownPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("fallback-page")).toHaveTextContent("Test Page");
	});
});
