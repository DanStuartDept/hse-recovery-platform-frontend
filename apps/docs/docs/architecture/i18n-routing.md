---
sidebar_position: 5
---

# i18n Routing

Internationalisation is handled by the `@repo/i18n` package (`packages/i18n`). It provides locale-aware URL routing, dictionary loading with a two-layer merge strategy, and client-side translation helpers.

---

## Locale configuration

Each app declares its supported locales in an `I18nConfig` object:

```ts
// apps/hse-multisite-template/src/lib/i18n/config.ts
export const i18nConfig: I18nConfig = {
  defaultLocale: "en",
  locales: ["en", "ga"],
};
```

The `defaultLocale` has special URL treatment: it is hidden from the URL path. All other locales get a prefix.

| URL | Resolved locale |
|---|---|
| `/` | `en` (default, no prefix) |
| `/about/` | `en` |
| `/ga/` | `ga` |
| `/ga/about/` | `ga` |

---

## Middleware — `createI18nProxy`

`createI18nProxy(config)` returns a Next.js middleware function that enforces the locale URL convention on every incoming request.

```ts
// apps/hse-multisite-template/src/middleware.ts
import { createI18nProxy } from "@repo/i18n";
import { i18nConfig } from "@/lib/i18n/config";

export default createI18nProxy(i18nConfig);
```

### Logic

The middleware runs through this decision tree for each request:

1. **Does the pathname already have a locale prefix?**
   - **Yes, and it is the default locale** (e.g., `/en/about/`) → `302 redirect` to the stripped path (`/about/`). The default locale must never appear in URLs.
   - **Yes, and it is a non-default locale** (e.g., `/ga/about/`) → `NextResponse.next()` — pass through unchanged.

2. **No locale prefix** → detect preferred locale from the `Accept-Language` header using `@formatjs/intl-localematcher` and `negotiator`.
   - If the preferred locale is **not** the default → `302 redirect` to `/{locale}{pathname}` (e.g., `/ga/about/`).
   - If the preferred locale **is** the default → `rewrite` to `/{defaultLocale}{pathname}` (e.g., internally rewrite `/about/` to `/en/about/`). The URL visible to the user stays unchanged.

The rewrite means the App Router segment `[lang]` always receives a locale value, even for paths where the locale is hidden from the public URL.

---

## Route structure

Because `[lang]` always receives a value, the App Router file tree works cleanly:

```
src/app/
└── [lang]/
    ├── layout.tsx          ← loads dictionary, fetches header/footer
    ├── [[...slug]]/
    │   └── page.tsx        ← catch-all CMS page renderer
    ├── error.tsx
    └── not-found.tsx
```

The `layout.tsx` `generateStaticParams` pre-generates one route segment per locale:

```ts
export async function generateStaticParams() {
  return i18nConfig.locales.map((lang) => ({ lang }));
}
```

---

## Dictionary format

Dictionaries are stored as **categorized JSON** — a two-level `{ category: { key: value } }` object. This structure groups related strings and avoids flat-file key collisions.

```json
// apps/hse-multisite-template/src/dictionaries/en.json
{
  "meta": {
    "defaultDescription": "Ireland's national health service"
  },
  "nav": {
    "home": "Home",
    "skipToContent": "Skip to content"
  }
}
```

The `@repo/i18n` package also ships a **shared dictionary** (in `packages/i18n/dictionaries/`) that contains strings used across all apps in the monorepo (e.g., common UI labels). The shared dictionary is merged with the app dictionary on load.

---

## Loading dictionaries — `loadDictionary` and `getDictionary`

Both functions are exported from `@repo/i18n` and are intended for use in Server Components and API routes.

### `loadDictionary`

Returns a flat `Record<string, string>` suitable for serialisation across the server/client boundary:

```ts
const flat = await loadDictionary(locale, dictionaryLoaders, i18nConfig.defaultLocale);
// → { "meta.defaultDescription": "Ireland's national health service", "nav.home": "Home", ... }
```

**Merge order (last wins):**
1. Default locale shared dict (from `@repo/i18n`)
2. Default locale app dict
3. Requested locale shared dict
4. Requested locale app dict

This means a non-default locale only needs to provide keys that differ from the default; all other keys fall back to the default locale value. If no loader exists for the requested locale, `loadDictionary` throws an error.

### `getDictionary`

Wraps `loadDictionary` and passes the flat result through `unflatten()` to produce a nested object:

```ts
const dict = await getDictionary<Dictionary>(locale, dictionaryLoaders, i18nConfig.defaultLocale);
// → { meta: { defaultDescription: "..." }, nav: { home: "Home" } }
```

### `DictionaryLoaders`

Each app provides a `DictionaryLoaders` map — a record of locale-keyed async import functions:

```ts
// apps/hse-multisite-template/src/lib/i18n/loaders.ts
export const dictionaryLoaders: DictionaryLoaders = {
  en: () => import("@/dictionaries/en.json"),
  ga: () => import("@/dictionaries/ga.json"),
};
```

Dynamic imports ensure that only the dictionary for the active locale is loaded at runtime, not all locales at once.

---

## Client components — `DictionaryProvider` and `useDictionary`

Functions cannot cross the Next.js serialisation boundary between Server and Client Components. To make the dictionary available in client components, the `[lang]/layout.tsx` loads the flat dictionary on the server and passes it to `DictionaryProvider`:

```tsx
// Server Component (layout.tsx)
const flat = await loadDictionary(lang, dictionaryLoaders, i18nConfig.defaultLocale);

return (
  <DictionaryProvider flat={flat} locale={lang}>
    {children}
  </DictionaryProvider>
);
```

`DictionaryProvider` is a `"use client"` component. It calls `unflatten(flat, locale)` inside a `useMemo` to rebuild the nested object with plural functions on the client side — plural functions cannot be serialised but can be reconstructed from the flat strings.

In any Client Component nested under the layout, access translations with `useDictionary`:

```tsx
"use client";
import { useDictionary } from "@repo/i18n";
import type { Dictionary } from "@/lib/i18n/types";

function MyComponent() {
  const dict = useDictionary<Dictionary>();
  return <span>{dict.nav.home}</span>;
}
```

`useDictionary` throws if called outside a `DictionaryProvider`.

---

## String helpers

### `interpolate`

Replace `{key}` placeholders in a template string:

```ts
interpolate("Hello, {name}!", { name: "World" });
// → "Hello, World!"
```

Unmatched placeholders are left as-is.

### `plural`

Select the correct plural form for a count using `Intl.PluralRules`, then interpolate `{count}`:

```ts
plural({ one: "{count} result", other: "{count} results" }, 3, "en");
// → "3 results"
```

Dictionary keys ending in `_zero`, `_one`, `_two`, `_few`, `_many`, or `_other` are automatically grouped by `unflatten()` into a `(count: number) => string` function at the base key path. An explicit `_zero` entry is honoured even for locales where CLDR maps 0 to `other` (e.g., English).

### `rich`

Parse `<tag>inner text</tag>` patterns in a template string and replace them with React nodes:

```tsx
rich("Read our <link>privacy policy</link>.", {
  link: (children) => <a href="/privacy">{children}</a>,
});
// → ["Read our ", <a href="/privacy">privacy policy</a>, "."]
```

Returns a `ReactNode[]` array suitable for direct JSX rendering. Tags with no matching factory function are left as plain text. Each node in the array is wrapped in a keyed `Fragment` to suppress React "missing key" warnings.

---

## Type safety

The `@repo/i18n` package ships a set of utility types that provide full type inference for dictionaries:

| Type | Purpose |
|---|---|
| `I18nConfig` | Shape of the locale configuration object |
| `CategorizedDictionary` | Two-level `{ category: { key: value } }` shape |
| `DictionaryLoaders` | Locale-keyed async loader map |
| `FlattenCategorized<T>` | Compile-time flattening of a categorized dict type |
| `Unflatten<T>` | Converts a flat dotted-key type to a nested object type; plural keys become `(count: number) => string` |
| `MergedDictionary<TApp>` | Merges and unflattens the shared dict type with an app dict type |

Usage in an app:

```ts
// packages/i18n/src/types — MergedDictionary usage
import type appDict from "@/dictionaries/en.json";
export type Dictionary = MergedDictionary<typeof appDict>;
```

`Dictionary` then provides fully-typed access to all translation keys, including plural functions where applicable.
