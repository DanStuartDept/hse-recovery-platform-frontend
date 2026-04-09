import { describe, expect, it } from "vitest";
import { flattenCategorized } from "./flatten-categorized";

describe("flattenCategorized", () => {
	it("flattens categories into dotted keys", () => {
		const input = {
			common: { skipToContent: "Skip to main content", backToTop: "Back to top" },
			footer: { label: "HSE Live" },
		};
		expect(flattenCategorized(input)).toEqual({
			"common.skipToContent": "Skip to main content",
			"common.backToTop": "Back to top",
			"footer.label": "HSE Live",
		});
	});

	it("preserves dotted keys within categories", () => {
		const input = {
			footer: { "social.facebook.label": "HSE Facebook", "social.facebook.href": "https://fb.com" },
		};
		expect(flattenCategorized(input)).toEqual({
			"footer.social.facebook.label": "HSE Facebook",
			"footer.social.facebook.href": "https://fb.com",
		});
	});

	it("returns an empty object for empty input", () => {
		expect(flattenCategorized({})).toEqual({});
	});

	it("handles a category with no keys", () => {
		const input = { empty: {} };
		expect(flattenCategorized(input)).toEqual({});
	});

	it("handles a single category with one key", () => {
		const input = { meta: { title: "Hello" } };
		expect(flattenCategorized(input)).toEqual({ "meta.title": "Hello" });
	});
});
