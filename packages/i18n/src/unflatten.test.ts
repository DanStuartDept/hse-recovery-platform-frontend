import { describe, expect, expectTypeOf, it } from "vitest";
import type { FlattenCategorized, MergedDictionary, Unflatten } from "./types";
import { unflatten } from "./unflatten";

describe("unflatten", () => {
	it("converts a flat dotted-key object to a nested object", () => {
		const flat = { "a.b": "hello", "a.c": "world" };
		const result = unflatten(flat, "en");
		expect(result).toEqual({ a: { b: "hello", c: "world" } });
	});

	it("handles keys without dots", () => {
		const flat = { greeting: "hello" };
		const result = unflatten(flat, "en");
		expect(result).toEqual({ greeting: "hello" });
	});

	it("handles an empty object", () => {
		expect(unflatten({}, "en")).toEqual({});
	});

	it("handles deeply nested keys", () => {
		const flat = { "a.b.c.d": "deep" };
		const result = unflatten(flat, "en") as { a: { b: { c: { d: string } } } };
		expect(result.a.b.c.d).toBe("deep");
	});

	it("collapses plural suffixed keys into a function", () => {
		const flat = {
			"search.resultCount_zero": "No results",
			"search.resultCount_one": "1 result",
			"search.resultCount_other": "{count} results",
		};
		const result = unflatten(flat, "en") as { search: { resultCount: (n: number) => string } };
		expect(typeof result.search.resultCount).toBe("function");
		expect(result.search.resultCount(0)).toBe("No results");
		expect(result.search.resultCount(1)).toBe("1 result");
		expect(result.search.resultCount(5)).toBe("5 results");
	});

	it("mixes plural and non-plural keys at the same level", () => {
		const flat = {
			"search.heading": "Search",
			"search.resultCount_one": "1 result",
			"search.resultCount_other": "{count} results",
		};
		const result = unflatten(flat, "en") as {
			search: { heading: string; resultCount: (n: number) => string };
		};
		expect(result.search.heading).toBe("Search");
		expect(result.search.resultCount(3)).toBe("3 results");
	});
});

describe("Unflatten type", () => {
	it("produces nested types from flat keys", () => {
		type Flat = { "a.b": string; "a.c": string; d: string };
		type Nested = Unflatten<Flat>;
		expectTypeOf<Nested>().toEqualTypeOf<{
			readonly a: { readonly b: string; readonly c: string };
			readonly d: string;
		}>();
	});

	it("converts plural-suffixed keys to functions", () => {
		type Flat = { count_one: string; count_other: string };
		type Nested = Unflatten<Flat>;
		expectTypeOf<Nested>().toEqualTypeOf<{ readonly count: (count: number) => string }>();
	});
});

describe("FlattenCategorized type", () => {
	it("produces flat dotted keys from categorized shape", () => {
		type Categorized = {
			common: { skipToContent: string; backToTop: string };
			footer: { label: string };
		};
		type Flat = FlattenCategorized<Categorized>;
		expectTypeOf<Flat>().toEqualTypeOf<{
			"common.skipToContent": string;
			"common.backToTop": string;
			"footer.label": string;
		}>();
	});
});

describe("MergedDictionary type", () => {
	it("merges shared and app categorized types into a nested type", () => {
		type AppDict = {
			meta: { title: string };
			home: { heading: string };
		};
		type Merged = MergedDictionary<AppDict>;
		// Should include both shared keys (common.skipToContent etc.) and app keys
		expectTypeOf<Merged>().toHaveProperty("common");
		expectTypeOf<Merged>().toHaveProperty("meta");
		expectTypeOf<Merged>().toHaveProperty("home");
	});
});
