import { describe, expect, it, vi } from "vitest";
import type { DictionaryLoaders } from "./types";

// Mock shared loaders so tests are isolated from actual JSON files
vi.mock("./shared-loaders", () => ({
	sharedLoaders: {
		"en-ie": vi.fn(() => Promise.resolve({ "common.hello": "Hello" })),
		ga: vi.fn(() => Promise.resolve({ "common.hello": "Dia duit" })),
	},
}));

import { getDictionary, loadDictionary } from "./get-dictionary";

const mockLoaders: DictionaryLoaders = {
	"en-ie": () => Promise.resolve({ default: { "app.title": "My App", "common.hello": "Hi" } }),
	ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
};

describe("loadDictionary", () => {
	it("merges shared and app dictionaries (flat)", async () => {
		const flat = await loadDictionary("en-ie", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi"); // app overrides shared
		expect(flat["app.title"]).toBe("My App");
	});

	it("app strings override shared strings on key collision", async () => {
		const flat = await loadDictionary("en-ie", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi");
	});

	it("falls back to default locale for missing keys", async () => {
		const loaders: DictionaryLoaders = {
			"en-ie": () => Promise.resolve({ default: { "app.title": "My App", "app.subtitle": "Welcome" } }),
			ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
		};
		const flat = await loadDictionary("ga", loaders, "en-ie");
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["app.subtitle"]).toBe("Welcome"); // fell back to en-ie
	});

	it("works without defaultLocale (no fallback)", async () => {
		const loaders: DictionaryLoaders = {
			ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
		};
		const flat = await loadDictionary("ga", loaders);
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["common.hello"]).toBe("Dia duit"); // from shared only
	});

	it("handles locale with no shared dictionary", async () => {
		const loaders: DictionaryLoaders = {
			uk: () => Promise.resolve({ default: { "app.title": "Мій додаток" } }),
		};
		const flat = await loadDictionary("uk", loaders);
		expect(flat["app.title"]).toBe("Мій додаток");
		expect(flat["common.hello"]).toBeUndefined();
	});

	it("throws a descriptive error for unknown locale", async () => {
		const loaders: DictionaryLoaders = {
			"en-ie": () => Promise.resolve({ default: {} }),
		};
		await expect(loadDictionary("fr", loaders)).rejects.toThrow('No dictionary loader for locale "fr"');
	});
});

describe("getDictionary", () => {
	it("returns a nested object with string values", async () => {
		const dict = await getDictionary<{ common: { hello: string }; app: { title: string } }>("en-ie", mockLoaders);
		expect(dict.common.hello).toBe("Hi");
		expect(dict.app.title).toBe("My App");
	});

	it("returns nested object with plural functions when present", async () => {
		const loaders: DictionaryLoaders = {
			"en-ie": () =>
				Promise.resolve({
					default: { "search.count_one": "1 result", "search.count_other": "{count} results" },
				}),
		};
		const dict = await getDictionary<{ search: { count: (n: number) => string } }>("en-ie", loaders);
		expect(dict.search.count(1)).toBe("1 result");
		expect(dict.search.count(5)).toBe("5 results");
	});
});
