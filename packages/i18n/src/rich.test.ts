import type { ReactElement } from "react";
import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";
import { rich } from "./rich";

/** Unwrap a keyed Fragment to get the inner child node. */
function unwrap(node: unknown): unknown {
	const el = node as ReactElement<{ children: unknown }>;
	if (el && el.type === Fragment) return el.props.children;
	return node;
}

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
		expect(unwrap(result[0])).toBe("Click ");
		expect(unwrap(result[2])).toBe(" now");
		const inner = unwrap(result[1]) as ReactElement<{ children: string }>;
		expect(inner.type).toBe("a");
		expect(inner.props.children).toBe("here");
	});

	it("replaces multiple tags", () => {
		const result = rich("<bold>Hello</bold> and <italic>world</italic>", {
			bold: (text) => createElement("strong", null, text),
			italic: (text) => createElement("em", null, text),
		});
		expect(result).toHaveLength(3);
		expect((unwrap(result[0]) as ReactElement).type).toBe("strong");
		expect(unwrap(result[1])).toBe(" and ");
		expect((unwrap(result[2]) as ReactElement).type).toBe("em");
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
		expect((unwrap(result[0]) as ReactElement).type).toBe("strong");
	});

	it("assigns unique keys to each item in the returned array", () => {
		const result = rich("Click <link>here</link> now", {
			link: (text) => createElement("a", { href: "/" }, text),
		});
		const keys = result.map((node) => (node as ReactElement).key);
		const uniqueKeys = new Set(keys);
		expect(uniqueKeys.size).toBe(result.length);
	});
});
