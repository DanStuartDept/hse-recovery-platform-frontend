# @repo/i18n

Locale routing, dictionary loading, and translation helpers for Next.js App Router apps.

## Usage

### Middleware routing

```typescript
// middleware.ts
import { createI18nProxy } from "@repo/i18n";

const i18nProxy = createI18nProxy({
  defaultLocale: "en",
  locales: ["en", "ga"],
});

export function middleware(request: NextRequest) {
  return i18nProxy(request);
}
```

The default locale is hidden from the URL (`/about`). Non-default locales get a prefix (`/ga/about`). Requests to `/<defaultLocale>/...` are redirected to strip the prefix. Accept-Language negotiation selects the locale for prefix-less URLs.

### Loading dictionaries (server)

```typescript
// app/[lang]/layout.tsx
import { getDictionary } from "@repo/i18n";

const loaders: DictionaryLoaders = {
  en: () => import("./dictionaries/en.json"),
  ga: () => import("./dictionaries/ga.json"),
};

const dict = await getDictionary(params.lang, loaders, "en");
// dict is a nested object matching the JSON structure
```

`getDictionary` merges the default locale dictionary as a fallback before loading the requested locale. Use `loadDictionary` if you need the raw flat key–value map.

### Client components

Wrap a subtree with `DictionaryProvider` and read translations via `useDictionary`:

```typescript
// layout.tsx (server component)
<DictionaryProvider dictionary={dict}>
  {children}
</DictionaryProvider>

// nav.tsx ("use client")
import { useDictionary } from "@repo/i18n";

const dict = useDictionary();
// dict.nav.home, dict.nav.contact, ...
```

### String helpers

```typescript
import { interpolate, plural, rich } from "@repo/i18n";

// Variable substitution
interpolate("Hello, {name}!", { name: "World" }); // "Hello, World!"

// Pluralisation (uses Intl.PluralRules; keys in JSON: key_one / key_other)
plural(dict.items, count); // "1 item" | "3 items"

// Rich text tags → React nodes
rich("Read <link>more</link>", { link: (children) => <a href="/more">{children}</a> });
```

## Dictionary format

Dictionaries are flat JSON files with dot-separated keys. Plural variants use `_one` / `_other` (and other CLDR suffixes) as key suffixes:

```json
{
  "nav.home": "Home",
  "nav.contact": "Contact",
  "items_one": "{count} item",
  "items_other": "{count} items"
}
```

`getDictionary` unflattens these into a nested object and replaces plural groups with `(count: number) => string` functions.

## Exports

| Export              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `createI18nProxy`   | Factory returning a Next.js middleware-like function |
| `loadDictionary`    | Load and merge flat dictionaries for a locale        |
| `getDictionary`     | Load, merge, and unflatten dictionaries              |
| `DictionaryProvider`| React context provider for client components         |
| `useDictionary`     | React hook to read the dictionary                    |
| `interpolate`       | Variable substitution in strings                     |
| `plural`            | Pluralisation using Intl.PluralRules                 |
| `rich`              | Rich text with React node tag factories              |
| `unflatten`         | Convert flat dotted keys to a nested object          |

Types (`I18nConfig`, `DictionaryLoaders`) are available from `@repo/i18n/types`.

## Architecture

Source-only package — no build step. The `exports` map points directly at `.ts`/`.tsx` files.
