import type { CMSClient } from "@repo/wagtail-api-client";
import { CMSBlockComponentsKeysSchema } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CMSRenderContext } from "../types/index";
import { BlockBrightcove } from "./block-brightcove";
import { BlockFallback } from "./block-fallback";
import { BlockText } from "./block-text";
import { defaultBlockRegistry } from "./index";

const mockContext: CMSRenderContext = {
	page: {
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
	} as CMSPageProps,
	apiClient: { fetchContent: vi.fn() } as unknown as CMSClient,
	position: {
		index: 0,
		isFirst: true,
		isLast: true,
		previous: null,
		next: null,
	},
};

const mockRenderBlocks = vi.fn(() => []);

describe("defaultBlockRegistry completeness", () => {
	const allBlockKeys = CMSBlockComponentsKeysSchema.options;

	it("has a component mapped for every CMSBlockComponentsKeys value", () => {
		for (const key of allBlockKeys) {
			expect(
				defaultBlockRegistry[key],
				`Missing block registry entry for "${key}"`,
			).toBeDefined();
		}
	});

	it("maps all 19 block types", () => {
		expect(allBlockKeys).toHaveLength(19);
		expect(Object.keys(defaultBlockRegistry)).toHaveLength(19);
	});
});

describe("BlockText value normalization", () => {
	it("handles string value", () => {
		render(
			<BlockText
				id="1"
				type="text"
				value="<p>Hello</p>"
				context={mockContext}
				renderBlocks={mockRenderBlocks}
			/>,
		);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("handles object value with body field", () => {
		render(
			<BlockText
				id="2"
				type="text"
				value={{ body: "<p>World</p>" }}
				context={mockContext}
				renderBlocks={mockRenderBlocks}
			/>,
		);
		expect(screen.getByText("World")).toBeInTheDocument();
	});
});

describe("BlockBrightcove URL construction", () => {
	it("builds correct Brightcove player URL from value fields", () => {
		render(
			<BlockBrightcove
				id="1"
				type="brightcove_video"
				value={{
					video_id: "123",
					account_id: "456",
					player_slug: "default",
					video_title: "My Video",
					display_video_title: true,
					video_description: "A description",
				}}
				context={mockContext}
				renderBlocks={mockRenderBlocks}
			/>,
		);
		expect(screen.getByTitle("brightcove-player")).toHaveAttribute(
			"src",
			"https://players.brightcove.net/456/default_default/index.html?videoId=123",
		);
	});
});

describe("BlockFallback", () => {
	it("renders nothing when not in local environment", () => {
		const { container } = render(
			<BlockFallback
				id="1"
				// biome-ignore lint/suspicious/noExplicitAny: testing unmapped block type
				type={"unknown" as any}
				value={{ foo: "bar" }}
				context={mockContext}
				renderBlocks={mockRenderBlocks}
			/>,
		);
		expect(container.innerHTML).toBe("");
	});
});
