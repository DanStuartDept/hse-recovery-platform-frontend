import type { ReactElement } from "react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { rich } from "./rich";

describe("rich", () => {
	it("returns plain text as-is when no tags", () => {
		const result = rich("Hello world", {});
		expect(result).toEqual(["Hello world"]);
	});

	it("replaces a single tag", () => {
		const result = rich("Click <link>here</link> now", {
			link: (text) => createElement("a", { href: "/" }, text),
		});
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("Click ");
		expect(result[2]).toBe(" now");
		expect((result[1] as unknown as ReactElement).type).toBe("a");
		expect((result[1] as unknown as ReactElement<{ children: string }>).props.children).toBe("here");
	});

	it("replaces multiple tags", () => {
		const result = rich("<bold>Hello</bold> and <italic>world</italic>", {
			bold: (text) => createElement("strong", null, text),
			italic: (text) => createElement("em", null, text),
		});
		expect(result).toHaveLength(3);
		expect((result[0] as unknown as ReactElement).type).toBe("strong");
		expect(result[1]).toBe(" and ");
		expect((result[2] as unknown as ReactElement).type).toBe("em");
	});

	it("treats unmatched tags as plain text", () => {
		const result = rich("Hello <unknown>world</unknown>", {});
		expect(result).toEqual(["Hello <unknown>world</unknown>"]);
	});

	it("handles empty template", () => {
		expect(rich("", {})).toEqual([""]);
	});

	it("handles tag at start and end", () => {
		const result = rich("<b>all bold</b>", {
			b: (text) => createElement("strong", null, text),
		});
		expect(result).toHaveLength(1);
		expect((result[0] as unknown as ReactElement).type).toBe("strong");
	});
});
