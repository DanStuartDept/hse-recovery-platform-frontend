import { describe, expect, it, vi } from "vitest";
import type { DictionaryLoaders } from "./types";

// Mock shared loaders so tests are isolated from actual JSON files
vi.mock("./shared-loaders", () => ({
	sharedLoaders: {
		en: vi.fn(() => Promise.resolve({ "common.hello": "Hello" })),
		ga: vi.fn(() => Promise.resolve({ "common.hello": "Dia duit" })),
	},
}));

import { getDictionary, loadDictionary } from "./get-dictionary";

// TODO(task-4): update mocks to use categorized format once loadDictionary calls flattenCategorized
const mockLoaders = {
	en: () => Promise.resolve({ default: { "app.title": "My App", "common.hello": "Hi" } }),
	ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
} as unknown as DictionaryLoaders;

describe("loadDictionary", () => {
	it("merges shared and app dictionaries (flat)", async () => {
		const flat = await loadDictionary("en", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi"); // app overrides shared
		expect(flat["app.title"]).toBe("My App");
	});

	it("app strings override shared strings on key collision", async () => {
		const flat = await loadDictionary("en", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi");
	});

	it("falls back to default locale for missing keys", async () => {
		const loaders = {
			en: () => Promise.resolve({ default: { "app.title": "My App", "app.subtitle": "Welcome" } }),
			ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
		} as unknown as DictionaryLoaders;
		const flat = await loadDictionary("ga", loaders, "en");
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["app.subtitle"]).toBe("Welcome"); // fell back to en
	});

	it("works without defaultLocale (no fallback)", async () => {
		const loaders = {
			ga: () => Promise.resolve({ default: { "app.title": "Mo Aip" } }),
		} as unknown as DictionaryLoaders;
		const flat = await loadDictionary("ga", loaders);
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["common.hello"]).toBe("Dia duit"); // from shared only
	});

	it("handles locale with no shared dictionary", async () => {
		const loaders = {
			uk: () => Promise.resolve({ default: { "app.title": "Мій додаток" } }),
		} as unknown as DictionaryLoaders;
		const flat = await loadDictionary("uk", loaders);
		expect(flat["app.title"]).toBe("Мій додаток");
		expect(flat["common.hello"]).toBeUndefined();
	});

	it("throws a descriptive error for unknown locale", async () => {
		const loaders = {
			en: () => Promise.resolve({ default: {} }),
		} as unknown as DictionaryLoaders;
		await expect(loadDictionary("fr", loaders)).rejects.toThrow('No dictionary loader for locale "fr"');
	});
});

describe("getDictionary", () => {
	it("returns a nested object with string values", async () => {
		const dict = await getDictionary<{ common: { hello: string }; app: { title: string } }>("en", mockLoaders);
		expect(dict.common.hello).toBe("Hi");
		expect(dict.app.title).toBe("My App");
	});

	it("returns nested object with plural functions when present", async () => {
		const loaders = {
			en: () =>
				Promise.resolve({
					default: { "search.count_one": "1 result", "search.count_other": "{count} results" },
				}),
		} as unknown as DictionaryLoaders;
		const dict = await getDictionary<{ search: { count: (n: number) => string } }>("en", loaders);
		expect(dict.search.count(1)).toBe("1 result");
		expect(dict.search.count(5)).toBe("5 results");
	});
});
