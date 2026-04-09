# Shared Dictionaries & Categorized Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce shared default dictionaries with HSE-wide footer strings and adopt a categorized (two-level) JSON format across all dictionaries, so every app inherits footer content automatically and translations work end-to-end.

**Architecture:** A new `flattenCategorized()` runtime utility converts `Record<string, Record<string, string>>` to `Record<string, string>` inside `loadDictionary` before merging. Both shared and app dictionaries migrate from flat dot-key JSON to categorized JSON. New utility types (`FlattenCategorized`, `MergedDictionary`) eliminate per-app type boilerplate and ensure shared keys appear in the `Dictionary` type.

**Tech Stack:** TypeScript, Vitest, React 19, Next.js 16 App Router, `@repo/i18n` (source-only package)

**Spec:** `docs/superpowers/specs/2026-04-09-shared-dictionaries-design.md`

---

## File Map

### `@repo/i18n` package (`packages/i18n/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/flatten-categorized.ts` | Runtime `flattenCategorized()` function |
| Create | `src/flatten-categorized.test.ts` | Tests for `flattenCategorized()` |
| Modify | `src/types.ts` | Add `CategorizedDictionary`, `FlattenCategorized<T>`, `MergedDictionary<TApp>`, update `DictionaryLoaders` |
| Modify | `src/get-dictionary.ts` | Call `flattenCategorized()` on each loaded dictionary |
| Modify | `src/get-dictionary.test.ts` | Update mocks to categorized format |
| Modify | `src/shared-loaders.ts` | Update return type to match categorized shape |
| Modify | `src/index.ts` | Export new utility and types |
| Modify | `dictionaries/en.json` | Expand with categorized `common` + `footer` content |
| Modify | `dictionaries/ga.json` | Expand with Irish translations in categorized format |

### App (`apps/hse-multisite-template/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/dictionaries/en.json` | Convert from flat to categorized format |
| Modify | `src/dictionaries/ga.json` | Convert from flat to categorized format |
| Modify | `src/lib/i18n/dictionary.ts` | Simplify to `MergedDictionary<typeof app>` |
| Modify | `src/lib/i18n/loaders.ts` | Update `DictionaryLoaders` type (auto via changed type) |
| Modify | `src/components/site-footer/site-footer.tsx` | Replace hardcoded strings with dictionary lookups |

---

## Task 1: `flattenCategorized()` runtime utility

**Files:**
- Create: `packages/i18n/src/flatten-categorized.ts`
- Create: `packages/i18n/src/flatten-categorized.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/i18n/src/flatten-categorized.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/i18n && pnpm vitest run src/flatten-categorized.test.ts`
Expected: FAIL — module `./flatten-categorized` not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/i18n/src/flatten-categorized.ts`:

```ts
/**
 * Flatten a categorized dictionary (`Record<string, Record<string, string>>`)
 * into a flat dotted-key dictionary (`Record<string, string>`).
 *
 * Example: `{ footer: { "social.fb": "FB" } }` → `{ "footer.social.fb": "FB" }`
 */
export function flattenCategorized(categorized: Record<string, Record<string, string>>): Record<string, string> {
	const flat: Record<string, string> = {};
	for (const [category, entries] of Object.entries(categorized)) {
		for (const [key, value] of Object.entries(entries)) {
			flat[`${category}.${key}`] = value;
		}
	}
	return flat;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/i18n && pnpm vitest run src/flatten-categorized.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/i18n/src/flatten-categorized.ts packages/i18n/src/flatten-categorized.test.ts
git commit -m "feat(i18n): add flattenCategorized() runtime utility

Converts categorized Record<string, Record<string, string>> to flat
dotted-key Record<string, string> for use in the dictionary loading
pipeline."
```

---

## Task 2: Type system additions

**Files:**
- Modify: `packages/i18n/src/types.ts`

This task adds three things:
1. `CategorizedDictionary` — named alias for the categorized shape
2. `FlattenCategorized<T>` — compile-time companion to `flattenCategorized()`
3. `MergedDictionary<TApp>` — eliminates per-app type boilerplate
4. Updated `DictionaryLoaders` — now expects categorized modules

- [ ] **Step 1: Write type-level tests**

These go at the bottom of `packages/i18n/src/unflatten.test.ts` (which already has type-level tests). Add a new `describe` block:

```ts
// Add these imports at the top (merge with existing imports):
import type { FlattenCategorized, MergedDictionary } from "./types";

// Add after the existing "Unflatten type" describe block:

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/i18n && pnpm vitest run src/unflatten.test.ts`
Expected: FAIL — `FlattenCategorized` and `MergedDictionary` not found in `./types`.

- [ ] **Step 3: Add types to `types.ts`**

In `packages/i18n/src/types.ts`, add after the existing `Unflatten` type (after line 46) and update `DictionaryLoaders` (line 15):

Replace the `DictionaryLoaders` type at line 15:

```ts
// old:
export type DictionaryLoaders = Record<string, () => Promise<{ default: Record<string, string> }>>;

// new:
/** Two-level categorized dictionary shape: `{ category: { key: value } }`. */
export type CategorizedDictionary = Record<string, Record<string, string>>;

/** Async loaders that return categorized dictionary modules, keyed by locale. */
export type DictionaryLoaders = Record<string, () => Promise<{ default: CategorizedDictionary }>>;
```

After line 46 (after the `Unflatten` type), add:

```ts
// ── Categorized dictionary utilities ──────────────────────────────────

/**
 * Compile-time companion to `flattenCategorized()`.
 * Converts `{ category: { key: string } }` to `{ "category.key": string }`.
 */
export type FlattenCategorized<T extends CategorizedDictionary> = {
	[Cat in keyof T & string as `${Cat}.${keyof T[Cat] & string}`]: string;
};

/**
 * Merges the shared dictionary type with an app dictionary type,
 * flattens both, and unflattens the result.
 *
 * Usage in an app:
 * ```ts
 * import type app from "@/dictionaries/en.json";
 * export type Dictionary = MergedDictionary<typeof app>;
 * ```
 */
export type MergedDictionary<TApp extends CategorizedDictionary> = Unflatten<
	FlattenCategorized<typeof import("../dictionaries/en.json").default> & FlattenCategorized<TApp>
>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/i18n && pnpm vitest run src/unflatten.test.ts`
Expected: All tests PASS (existing + new type tests).

- [ ] **Step 5: Run typecheck**

Run: `cd packages/i18n && pnpm typecheck`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/i18n/src/types.ts packages/i18n/src/unflatten.test.ts
git commit -m "feat(i18n): add FlattenCategorized, MergedDictionary types

- CategorizedDictionary: named alias for Record<string, Record<string, string>>
- FlattenCategorized<T>: compile-time flat key generation
- MergedDictionary<TApp>: one-liner app Dictionary type
- DictionaryLoaders: now expects categorized modules"
```

---

## Task 3: Expand shared dictionaries

**Files:**
- Modify: `packages/i18n/dictionaries/en.json`
- Modify: `packages/i18n/dictionaries/ga.json`

- [ ] **Step 1: Replace `packages/i18n/dictionaries/en.json`**

```json
{
	"common": {
		"skipToContent": "Skip to main content",
		"backToTop": "Back to top"
	},
	"footer": {
		"label": "HSE Live - we're here to help",
		"hours.weekday": "Monday to Friday: 8am to 8pm",
		"hours.saturday": "Saturday: 9am to 5pm",
		"hours.sunday": "Sunday: Closed",
		"hours.bankHoliday": "Bank holidays: Closed",
		"freephone.label": "Freephone:",
		"freephone.number": "1800 700 700",
		"freephone.href": "tel:1800700700",
		"international.label": "From outside Ireland:",
		"international.number": "00 353 1 240 8787",
		"international.href": "tel:0035312408787",
		"social.facebook.label": "HSE Facebook",
		"social.facebook.href": "https://www.facebook.com/HSElive/",
		"social.instagram.label": "HSE Instagram",
		"social.instagram.href": "https://instagram.com/irishhealthservice",
		"social.tiktok.label": "HSE TikTok",
		"social.tiktok.href": "https://www.tiktok.com/@hselive",
		"social.youtube.label": "HSE YouTube",
		"social.youtube.href": "https://www.youtube.com/channel/UCoNNhGGAYkdavsSXp1iVzCg",
		"social.linkedin.label": "HSE Linkedin",
		"social.linkedin.href": "https://ie.linkedin.com/company/health-service-executive",
		"cookieSettings": "Cookies settings"
	}
}
```

- [ ] **Step 2: Replace `packages/i18n/dictionaries/ga.json`**

```json
{
	"common": {
		"skipToContent": "Léim go dtí an príomhábhar",
		"backToTop": "Ar ais go barr"
	},
	"footer": {
		"label": "FSS Beo - táimid anseo chun cabhrú",
		"hours.weekday": "Luan go hAoine: 8rn go 8in",
		"hours.saturday": "Satharn: 9rn go 5in",
		"hours.sunday": "Domhnach: Dúnta",
		"hours.bankHoliday": "Laethanta saoire bainc: Dúnta",
		"freephone.label": "Saorghlaoch:",
		"freephone.number": "1800 700 700",
		"freephone.href": "tel:1800700700",
		"international.label": "Ó lasmuigh d'Éirinn:",
		"international.number": "00 353 1 240 8787",
		"international.href": "tel:0035312408787",
		"social.facebook.label": "FSS Facebook",
		"social.facebook.href": "https://www.facebook.com/HSElive/",
		"social.instagram.label": "FSS Instagram",
		"social.instagram.href": "https://instagram.com/irishhealthservice",
		"social.tiktok.label": "FSS TikTok",
		"social.tiktok.href": "https://www.tiktok.com/@hselive",
		"social.youtube.label": "FSS YouTube",
		"social.youtube.href": "https://www.youtube.com/channel/UCoNNhGGAYkdavsSXp1iVzCg",
		"social.linkedin.label": "FSS Linkedin",
		"social.linkedin.href": "https://ie.linkedin.com/company/health-service-executive",
		"cookieSettings": "Socruithe fianán"
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/i18n/dictionaries/en.json packages/i18n/dictionaries/ga.json
git commit -m "feat(i18n): expand shared dictionaries with footer content

Add categorized footer strings (label, hours, phone, social links,
cookie settings) to both en and ga shared dictionaries."
```

---

## Task 4: Wire `flattenCategorized()` into `loadDictionary`

**Files:**
- Modify: `packages/i18n/src/get-dictionary.ts`
- Modify: `packages/i18n/src/shared-loaders.ts`
- Modify: `packages/i18n/src/get-dictionary.test.ts`

- [ ] **Step 1: Update `shared-loaders.ts` return type**

Replace the entire file `packages/i18n/src/shared-loaders.ts`:

```ts
// Internal module — loads shared dictionaries from the package.
// Mocked in tests via vi.mock.
import type { CategorizedDictionary } from "./types";

export const sharedLoaders: Record<string, () => Promise<CategorizedDictionary>> = {
	en: () => import("../dictionaries/en.json").then((m) => m.default as CategorizedDictionary),
	ga: () => import("../dictionaries/ga.json").then((m) => m.default as CategorizedDictionary),
};
```

- [ ] **Step 2: Update `get-dictionary.ts` to flatten before merging**

Replace the entire file `packages/i18n/src/get-dictionary.ts`:

```ts
import { flattenCategorized } from "./flatten-categorized";
import { sharedLoaders } from "./shared-loaders";
import type { DictionaryLoaders } from "./types";
import { unflatten } from "./unflatten";

/**
 * Load and merge flat dictionaries for a locale (shared + app layers).
 * Returns the flat merged `Record<string, string>`.
 *
 * Each dictionary (categorized JSON) is flattened before merging.
 * Merge order (last wins):
 * 1. Default locale shared dict (fallback base, if `defaultLocale` provided and differs)
 * 2. Default locale app dict (fallback base)
 * 3. Requested locale shared dict
 * 4. Requested locale app dict
 */
export async function loadDictionary(
	locale: string,
	loaders: DictionaryLoaders,
	defaultLocale?: string,
): Promise<Record<string, string>> {
	let base: Record<string, string> = {};

	if (defaultLocale && locale !== defaultLocale) {
		const defaultShared = sharedLoaders[defaultLocale]
			? flattenCategorized(await sharedLoaders[defaultLocale]())
			: {};
		const defaultApp = loaders[defaultLocale]
			? flattenCategorized((await loaders[defaultLocale]()).default)
			: {};
		base = { ...defaultShared, ...defaultApp };
	}

	if (!loaders[locale]) {
		throw new Error(`No dictionary loader for locale "${locale}"`);
	}

	const shared = sharedLoaders[locale] ? flattenCategorized(await sharedLoaders[locale]()) : {};
	const app = flattenCategorized((await loaders[locale]()).default);

	return { ...base, ...shared, ...app };
}

/**
 * Load, merge, and unflatten dictionaries for a locale.
 * Returns a nested object with string values and plural functions.
 */
export async function getDictionary<T = Record<string, unknown>>(
	locale: string,
	loaders: DictionaryLoaders,
	defaultLocale?: string,
): Promise<T> {
	const flat = await loadDictionary(locale, loaders, defaultLocale);
	return unflatten(flat, locale) as T;
}
```

- [ ] **Step 3: Update `get-dictionary.test.ts` mocks to categorized format**

Replace the entire file `packages/i18n/src/get-dictionary.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { DictionaryLoaders } from "./types";

// Mock shared loaders so tests are isolated from actual JSON files.
// Return categorized format (Record<string, Record<string, string>>).
vi.mock("./shared-loaders", () => ({
	sharedLoaders: {
		en: vi.fn(() => Promise.resolve({ common: { hello: "Hello" } })),
		ga: vi.fn(() => Promise.resolve({ common: { hello: "Dia duit" } })),
	},
}));

import { getDictionary, loadDictionary } from "./get-dictionary";

const mockLoaders: DictionaryLoaders = {
	en: () => Promise.resolve({ default: { app: { title: "My App" }, common: { hello: "Hi" } } }),
	ga: () => Promise.resolve({ default: { app: { title: "Mo Aip" } } }),
};

describe("loadDictionary", () => {
	it("merges shared and app dictionaries (flat output)", async () => {
		const flat = await loadDictionary("en", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi"); // app overrides shared
		expect(flat["app.title"]).toBe("My App");
	});

	it("app strings override shared strings on key collision", async () => {
		const flat = await loadDictionary("en", mockLoaders);
		expect(flat["common.hello"]).toBe("Hi");
	});

	it("falls back to default locale for missing keys", async () => {
		const loaders: DictionaryLoaders = {
			en: () => Promise.resolve({ default: { app: { title: "My App", subtitle: "Welcome" } } }),
			ga: () => Promise.resolve({ default: { app: { title: "Mo Aip" } } }),
		};
		const flat = await loadDictionary("ga", loaders, "en");
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["app.subtitle"]).toBe("Welcome"); // fell back to en
	});

	it("works without defaultLocale (no fallback)", async () => {
		const loaders: DictionaryLoaders = {
			ga: () => Promise.resolve({ default: { app: { title: "Mo Aip" } } }),
		};
		const flat = await loadDictionary("ga", loaders);
		expect(flat["app.title"]).toBe("Mo Aip");
		expect(flat["common.hello"]).toBe("Dia duit"); // from shared only
	});

	it("handles locale with no shared dictionary", async () => {
		const loaders: DictionaryLoaders = {
			uk: () => Promise.resolve({ default: { app: { title: "Мій додаток" } } }),
		};
		const flat = await loadDictionary("uk", loaders);
		expect(flat["app.title"]).toBe("Мій додаток");
		expect(flat["common.hello"]).toBeUndefined();
	});

	it("throws a descriptive error for unknown locale", async () => {
		const loaders: DictionaryLoaders = {
			en: () => Promise.resolve({ default: {} }),
		};
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
		const loaders: DictionaryLoaders = {
			en: () =>
				Promise.resolve({
					default: { search: { count_one: "1 result", count_other: "{count} results" } },
				}),
		};
		const dict = await getDictionary<{ search: { count: (n: number) => string } }>("en", loaders);
		expect(dict.search.count(1)).toBe("1 result");
		expect(dict.search.count(5)).toBe("5 results");
	});
});
```

- [ ] **Step 4: Run all i18n package tests**

Run: `cd packages/i18n && pnpm vitest run`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/i18n/src/get-dictionary.ts packages/i18n/src/shared-loaders.ts packages/i18n/src/get-dictionary.test.ts
git commit -m "feat(i18n): wire flattenCategorized into loadDictionary

loadDictionary now flattens each categorized dictionary before merging.
Shared loaders return CategorizedDictionary. Test mocks updated to
categorized format."
```

---

## Task 5: Export new utility and types from package

**Files:**
- Modify: `packages/i18n/src/index.ts`

- [ ] **Step 1: Update `index.ts` exports**

Replace the entire file `packages/i18n/src/index.ts`:

```ts
// Types

// Proxy factory
export { createI18nProxy } from "./create-i18n-proxy";
// Dictionary loading
export { flattenCategorized } from "./flatten-categorized";
export { getDictionary, loadDictionary } from "./get-dictionary";
// String utilities
export { interpolate } from "./interpolate";
export type { PluralGroup } from "./plural";
export { plural } from "./plural";
// React provider
export { DictionaryProvider, useDictionary } from "./provider";
export { rich } from "./rich";
export type {
	CategorizedDictionary,
	DictionaryLoaders,
	FlattenCategorized,
	I18nConfig,
	MergedDictionary,
	RichTagFactory,
	Unflatten,
} from "./types";
export { unflatten } from "./unflatten";
```

- [ ] **Step 2: Run typecheck**

Run: `cd packages/i18n && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/i18n/src/index.ts
git commit -m "feat(i18n): export flattenCategorized, CategorizedDictionary, FlattenCategorized, MergedDictionary"
```

---

## Task 6: Migrate app dictionaries to categorized format

**Files:**
- Modify: `apps/hse-multisite-template/src/dictionaries/en.json`
- Modify: `apps/hse-multisite-template/src/dictionaries/ga.json`

- [ ] **Step 1: Replace `apps/hse-multisite-template/src/dictionaries/en.json`**

```json
{
	"meta": {
		"defaultDescription": "Health Service Executive — public health information and services for Ireland."
	},
	"home": {
		"title": "Welcome to HSE Multisite Template"
	},
	"error": {
		"heading": "Something went wrong",
		"body": "There was a problem loading this page. Please try again.",
		"tryAgain": "Try again"
	},
	"notFound": {
		"heading": "Page not found",
		"body": "We cannot find the page you are looking for.",
		"linkBroken": "The link may be broken, or the page may have been moved or deleted.",
		"checkUrl": "Check the URL you entered is correct.",
		"cantFindHeading": "If you still cannot find what you're looking for",
		"popularInfo": "The information may be in a popular section, for example:",
		"link.conditions": "health conditions and symptoms",
		"link.staff": "HSE staff news and information",
		"link.jobs": "HSE job search",
		"link.about": "information and news about the HSE",
		"contact": "Contact <contactLink>us</contactLink> if you have a question or want to give feedback."
	}
}
```

- [ ] **Step 2: Replace `apps/hse-multisite-template/src/dictionaries/ga.json`**

```json
{
	"meta": {
		"defaultDescription": "Feidhmeannacht na Seirbhíse Sláinte — eolas agus seirbhísí sláinte poiblí d'Éirinn."
	},
	"home": {
		"title": "Fáilte go dtí Teimpléad Aip an FSS"
	},
	"error": {
		"heading": "Chuaigh rud éigin mícheart",
		"body": "Bhí fadhb ann an leathanach seo a lódáil. Bain triail eile as le do thoil.",
		"tryAgain": "Bain triail eile as"
	},
	"notFound": {
		"heading": "Leathanach gan aimsiú",
		"body": "Ní féidir linn an leathanach a bhfuil tú ag lorg a aimsiú.",
		"linkBroken": "D'fhéadfadh go bhfuil an nasc briste, nó go bhfuil an leathanach bogtha nó scriosta.",
		"checkUrl": "Seiceáil go bhfuil an URL a chuir tú isteach ceart.",
		"cantFindHeading": "Mura bhfuil tú in ann a bhfuil uait a aimsiú fós",
		"popularInfo": "D'fhéadfadh an t-eolas a bheith i rannán coitianta, mar shampla:",
		"link.conditions": "coinníollacha sláinte agus comharthaí",
		"link.staff": "nuacht agus eolas d'fhoireann an FSS",
		"link.jobs": "cuardach post an FSS",
		"link.about": "eolas agus nuacht faoin FSS",
		"contact": "<contactLink>Déan teagmháil linn</contactLink> má tá ceist agat nó más mian leat aiseolas a thabhairt."
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/dictionaries/en.json apps/hse-multisite-template/src/dictionaries/ga.json
git commit -m "refactor(app): migrate app dictionaries to categorized format

Convert flat dot-key JSON to two-level categorized structure matching
the shared dictionary format."
```

---

## Task 7: Simplify app `Dictionary` type with `MergedDictionary`

**Files:**
- Modify: `apps/hse-multisite-template/src/lib/i18n/dictionary.ts`

- [ ] **Step 1: Replace `dictionary.ts`**

Replace the entire file `apps/hse-multisite-template/src/lib/i18n/dictionary.ts`:

```ts
import type { MergedDictionary } from "@repo/i18n";
import type app from "@/dictionaries/en.json";

/** Fully typed dictionary available via `useDictionary<Dictionary>()`. */
export type Dictionary = MergedDictionary<typeof app>;
```

- [ ] **Step 2: Run typecheck on the app**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: No errors. The `Dictionary` type now includes both shared keys (`common.*`, `footer.*`) and app keys (`meta.*`, `home.*`, `error.*`, `notFound.*`).

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/lib/i18n/dictionary.ts
git commit -m "refactor(app): simplify Dictionary type to MergedDictionary<typeof app>"
```

---

## Task 8: Update `SiteFooter` to read from dictionary

**Files:**
- Modify: `apps/hse-multisite-template/src/components/site-footer/site-footer.tsx`

- [ ] **Step 1: Replace `site-footer.tsx`**

Replace the entire file `apps/hse-multisite-template/src/components/site-footer/site-footer.tsx`:

```tsx
"use client";

import { Footer } from "@hseireland/hse-frontend-react";
import { useDictionary } from "@repo/i18n";
import { config } from "@repo/app-config";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { toggleOneTrustDisplay } from "@/lib/one-trust";

/**
 * Converts a CMS absolute URL to a relative path if it matches the CMS base URL.
 * External URLs are returned unchanged.
 */
function toLocalHref(url: string): string {
	if (url.startsWith(config.cms.baseURL)) {
		return url.slice(config.cms.baseURL.length) || "/";
	}
	return url;
}

/** Extract social link entries from the footer dictionary namespace. */
function getSocialLinks(footer: Dictionary["footer"]): { label: string; href: string }[] {
	const socialKeys = ["facebook", "instagram", "tiktok", "youtube", "linkedin"] as const;
	return socialKeys.map((key) => ({
		label: footer.social[key].label,
		href: footer.social[key].href,
	}));
}

/**
 * Props for the {@link SiteFooter} component.
 */
interface SiteFooterProps {
	/** Footer data from the CMS, or null to render the copyright-only fallback. */
	data: CMSFooterResponse | null;
}

/**
 * Site footer component that maps CMS footer data to the HSE design system Footer.
 * Renders a copyright-only fallback when CMS data is unavailable.
 */
export function SiteFooter({ data }: SiteFooterProps) {
	const dict = useDictionary<Dictionary>();

	if (!data) {
		return (
			<Footer>
				<Footer.Bottom>
					<Footer.Copyright />
				</Footer.Bottom>
			</Footer>
		);
	}

	const { footer } = dict;
	const socialLinks = getSocialLinks(footer);

	return (
		<Footer>
			<Footer.Top>
				<Footer.Label>{footer.label}</Footer.Label>
				<Footer.Content>
					<p>
						{footer.hours.weekday}
						<br />
						{footer.hours.saturday}
						<br />
						{footer.hours.sunday}
						<br />
						{footer.hours.bankHoliday}
					</p>
					<p>
						<strong>
							{footer.freephone.label} <a href={footer.freephone.href}>{footer.freephone.number}</a>
						</strong>
					</p>
					<p>
						<strong>
							{footer.international.label}{" "}
							<a href={footer.international.href}>{footer.international.number}</a>
						</strong>
					</p>
				</Footer.Content>
				<Footer.Content>
					{socialLinks.map((link) => (
						<Footer.ListItem
							key={link.label}
							href={link.href}
							target="_blank"
							rel="noreferrer noopener"
						>
							{link.label}
						</Footer.ListItem>
					))}
				</Footer.Content>
				<Footer.Content>
					{data.footer_links.map((link) => (
						<Footer.ListItem
							key={link.id}
							href={toLocalHref(link.link_url)}
							target="_blank"
							rel="noreferrer noopener"
						>
							{link.link_label}
						</Footer.ListItem>
					))}
					{!config.isLocalhost && config.oneTrustDomainId && (
						<Footer.ListItem asElement="button" onClick={toggleOneTrustDisplay}>
							{footer.cookieSettings}
						</Footer.ListItem>
					)}
				</Footer.Content>
			</Footer.Top>
			<Footer.Bottom>
				{data.footer_secondary_links.map((link) => (
					<Footer.ListItem
						key={link.id}
						asElement={Link}
						href={toLocalHref(link.link_url)}
					>
						{link.link_label}
					</Footer.ListItem>
				))}
				<Footer.Copyright />
			</Footer.Bottom>
		</Footer>
	);
}
```

- [ ] **Step 2: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/components/site-footer/site-footer.tsx
git commit -m "feat(app): replace hardcoded footer strings with dictionary lookups

SiteFooter now reads all text (label, hours, phone numbers, social
links, cookie button) from the i18n dictionary via useDictionary."
```

---

## Task 9: Update app-level test mocks

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/not-found.test.tsx`
- Modify: `apps/hse-multisite-template/src/app/[lang]/error.test.tsx`

The `DictionaryProvider` still accepts `flat: Record<string, string>`, so the test `flat` objects remain dot-keyed strings. However, the `Dictionary` type now includes shared keys. Tests that render components using `useDictionary<Dictionary>()` only need keys the component actually accesses — no changes needed if the component doesn't read shared keys.

- [ ] **Step 1: Verify existing app tests still pass without changes**

Run: `turbo run test --filter=hse-multisite-template`
Expected: All tests PASS. The `not-found.test.tsx` and `error.test.tsx` files supply flat dictionaries directly to `DictionaryProvider` — they bypass `loadDictionary` entirely, so the format change doesn't affect them.

- [ ] **Step 2: Commit (only if changes were needed)**

If all tests pass without changes, skip this commit — no files changed.

---

## Task 10: Full verification

- [ ] **Step 1: Run all package tests**

Run: `cd packages/i18n && pnpm vitest run`
Expected: All tests PASS.

- [ ] **Step 2: Run all app tests**

Run: `turbo run test --filter=hse-multisite-template`
Expected: All tests PASS.

- [ ] **Step 3: Run typecheck across the workspace**

Run: `pnpm typecheck`
Expected: No errors in any workspace.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: No errors (auto-fixes applied if any).

- [ ] **Step 5: Run build**

Run: `pnpm build`
Expected: All packages and apps build successfully.
