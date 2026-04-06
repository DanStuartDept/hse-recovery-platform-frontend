import { CMSBlockComponentsKeysSchema } from "@repo/wagtail-cms-types/blocks";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlockBrightcove } from "./block-brightcove";
import { BlockFallback } from "./block-fallback";
import { BlockText } from "./block-text";
import { defaultBlockRegistry } from "./index";

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

	it("maps all 18 block types", () => {
		expect(allBlockKeys).toHaveLength(18);
		expect(Object.keys(defaultBlockRegistry)).toHaveLength(18);
	});
});

describe("BlockText value normalization", () => {
	it("handles string value", () => {
		render(<BlockText id="1" type="text" value="<p>Hello</p>" />);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("handles object value with body field", () => {
		render(<BlockText id="2" type="text" value={{ body: "<p>World</p>" }} />);
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
			// biome-ignore lint/suspicious/noExplicitAny: testing unmapped block type
			<BlockFallback id="1" type={"unknown" as any} value={{ foo: "bar" }} />,
		);
		expect(container.innerHTML).toBe("");
	});
});
