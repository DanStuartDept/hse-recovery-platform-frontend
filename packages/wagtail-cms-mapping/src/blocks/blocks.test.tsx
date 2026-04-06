import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockText } from "./block-text";
import { BlockQuote } from "./block-quote";
import { BlockInsetText } from "./block-inset-text";
import { BlockFallback } from "./block-fallback";
import { BlockBrightcove } from "./block-brightcove";
import { BlockRelatedInfo } from "./block-related-info";

describe("BlockText", () => {
	it("renders string value as rich text", () => {
		render(<BlockText id="1" type="text" value="<p>Hello</p>" />);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});
	it("renders object value with body field", () => {
		render(<BlockText id="2" type="text" value={{ body: "<p>World</p>" }} />);
		expect(screen.getByText("World")).toBeInTheDocument();
	});
});

describe("BlockQuote", () => {
	it("renders title, body, and author", () => {
		render(<BlockQuote id="1" type="quote" value={{ title: "Quote Title", body: "Quote body", author: "Author" }} />);
		expect(screen.getByText("Quote Title")).toBeInTheDocument();
		expect(screen.getByText("Quote body")).toBeInTheDocument();
		expect(screen.getByText("Author")).toBeInTheDocument();
	});
	it("renders without optional fields", () => {
		render(<BlockQuote id="2" type="quote" value={{ title: "", body: "Only body", author: "" }} />);
		expect(screen.getByText("Only body")).toBeInTheDocument();
	});
});

describe("BlockInsetText", () => {
	it("renders inset text body", () => {
		render(<BlockInsetText id="1" type="inset_text" value={{ body: "<p>Important</p>" }} />);
		expect(screen.getByText("Important")).toBeInTheDocument();
	});
});

describe("BlockBrightcove", () => {
	it("renders iframe with correct src", () => {
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
		expect(screen.getByText("My Video")).toBeInTheDocument();
	});
});

describe("BlockRelatedInfo", () => {
	it("renders title and links", () => {
		render(
			<BlockRelatedInfo
				id="1"
				type="related_information"
				value={{
					title: "Related",
					links: [{ text: "Link 1", external_url: "/link1", new_window: false, internal_page: null }],
				}}
			/>,
		);
		expect(screen.getByText("Related")).toBeInTheDocument();
		expect(screen.getByText("Link 1")).toBeInTheDocument();
	});
});

describe("BlockFallback", () => {
	it("renders nothing when not in local environment", () => {
		const { container } = render(<BlockFallback id="1" type={"unknown" as any} value={{ foo: "bar" }} />);
		expect(container.innerHTML).toBe("");
	});
});
