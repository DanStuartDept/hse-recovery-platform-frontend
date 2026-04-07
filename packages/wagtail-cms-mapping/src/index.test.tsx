import type { CMSClient } from "@repo/wagtail-api-client";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCMSRenderer } from "./index";
import type { BlockComponentProps, PageLayoutProps } from "./types/index";

const mockApiClient = {
	fetchContent: vi.fn(),
} as unknown as CMSClient;

function makeBlock(type: string, value: unknown = {}): CMSBlockType {
	return { id: `block-${type}`, type: type as CMSBlockType["type"], value };
}

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

function makePage(
	type: string,
	extra: Record<string, unknown> = {},
): CMSPageProps {
	return {
		id: 1,
		title: "Test Page",
		meta: makePageMeta(type) as CMSPageProps["meta"],
		header: [],
		body: [],
		...extra,
	} as CMSPageProps;
}

describe("createCMSRenderer", () => {
	it("returns renderBlock, renderBlocks, and renderPage", () => {
		const renderer = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderer.renderBlock).toBeTypeOf("function");
		expect(renderer.renderBlocks).toBeTypeOf("function");
		expect(renderer.renderPage).toBeTypeOf("function");
	});

	it("renderBlocks returns empty array for empty input", () => {
		const { renderBlocks } = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderBlocks([])).toEqual([]);
	});

	it("renderBlocks returns empty array for undefined input", () => {
		const { renderBlocks } = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderBlocks(undefined as unknown as CMSBlockType[])).toEqual([]);
	});

	it("uses override block component when provided", () => {
		const CustomText = ({ value }: BlockComponentProps) => (
			<div data-testid="custom-text">{String(value)}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: CustomText },
		});
		const result = renderPage(
			makePage("hsebase.ContentPage", {
				body: [makeBlock("text", "hello")],
			}),
		);
		render(<>{result}</>);
		expect(screen.getByTestId("custom-text")).toBeInTheDocument();
	});

	it("uses override page component when provided", () => {
		const CustomPage = ({ page }: PageLayoutProps) => (
			<div data-testid="custom-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			pages: { "hsebase.ContentPage": CustomPage },
		});
		const result = renderPage(makePage("hsebase.ContentPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-page")).toHaveTextContent("Test Page");
	});

	it("uses custom fallbackBlock for unknown block types", () => {
		const CustomFallback = ({ type }: BlockComponentProps) => (
			<div data-testid="custom-fallback">{type}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			fallbackBlock: CustomFallback,
		});
		const result = renderPage(
			makePage("hsebase.ContentPage", {
				// biome-ignore lint/suspicious/noExplicitAny: testing unmapped block type
				body: [makeBlock("unknown_type" as any)],
			}),
		);
		render(<>{result}</>);
		expect(screen.getByTestId("custom-fallback")).toHaveTextContent(
			"unknown_type",
		);
	});

	it("uses custom fallbackPage for unknown page types", () => {
		const CustomFallback = ({ page }: PageLayoutProps) => (
			<div data-testid="fallback-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			fallbackPage: CustomFallback,
		});
		const result = renderPage(makePage("hsebase.UnknownPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("fallback-page")).toHaveTextContent("Test Page");
	});
});

describe("context.position", () => {
	it("computes isFirst, isLast, previous, next for block arrays", () => {
		const positions: {
			index: number;
			isFirst: boolean;
			isLast: boolean;
			prevType: string | null;
			nextType: string | null;
		}[] = [];
		const Spy = ({ context }: BlockComponentProps) => {
			positions.push({
				index: context.position.index,
				isFirst: context.position.isFirst,
				isLast: context.position.isLast,
				prevType: context.position.previous?.type ?? null,
				nextType: context.position.next?.type ?? null,
			});
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy, quote: Spy, image: Spy },
		});
		render(
			<>
				{renderPage(
					makePage("hsebase.ContentPage", {
						body: [
							makeBlock("text", "a"),
							makeBlock("quote", "b"),
							makeBlock("image", "c"),
						],
					}),
				)}
			</>,
		);
		expect(positions).toHaveLength(3);
		expect(positions[0]).toEqual({
			index: 0,
			isFirst: true,
			isLast: false,
			prevType: null,
			nextType: "quote",
		});
		expect(positions[1]).toEqual({
			index: 1,
			isFirst: false,
			isLast: false,
			prevType: "text",
			nextType: "image",
		});
		expect(positions[2]).toEqual({
			index: 2,
			isFirst: false,
			isLast: true,
			prevType: "quote",
			nextType: null,
		});
	});

	it("provides default position for single renderBlock", () => {
		let capturedPosition: BlockComponentProps["context"]["position"] | null =
			null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedPosition = context.position;
			return null;
		};
		const { renderPage, renderBlock } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		render(<>{renderPage(makePage("hsebase.ContentPage"))}</>);
		render(<>{renderBlock(makeBlock("text", "solo"))}</>);
		expect(capturedPosition).toEqual({
			index: 0,
			isFirst: true,
			isLast: true,
			previous: null,
			next: null,
		});
	});
});

describe("context.page", () => {
	it("provides the current page to block components", () => {
		let capturedPageTitle: string | null = null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedPageTitle = context.page.title;
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		render(
			<>
				{renderPage(
					makePage("hsebase.ContentPage", {
						title: "My Page",
						body: [makeBlock("text")],
					}),
				)}
			</>,
		);
		expect(capturedPageTitle).toBe("My Page");
	});
});

describe("context.apiClient", () => {
	it("passes the same apiClient instance to block components", () => {
		let capturedClient: unknown = null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedClient = context.apiClient;
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		render(
			<>
				{renderPage(
					makePage("hsebase.ContentPage", {
						body: [makeBlock("text")],
					}),
				)}
			</>,
		);
		expect(capturedClient).toBe(mockApiClient);
	});
});
