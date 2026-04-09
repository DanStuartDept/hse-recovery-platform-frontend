# Shared Default Dictionaries & Categorized Dictionary Format

**Date:** 2026-04-09
**Status:** Draft

---

## Goal

Introduce shared default dictionaries in `@repo/i18n` containing HSE-wide strings (footer content, social links, contact info, common UI labels) so that all apps inherit them automatically. Adopt a categorized dictionary format (matching the existing HSE locale API structure) across both shared and app dictionaries for consistency, readability, and forward-compatibility.

## Motivation

The `hse-multisite-template` footer currently hardcodes English strings — social links, contact info, opening hours, and labels. This creates two problems at scale:

1. **No i18n** — the strings can't be translated to Irish (or any other locale).
2. **Duplication across apps** — when 25+ sites are cloned from the template, a new social media account or changed phone number means updating every app individually.

The `@repo/i18n` package already has shared dictionary infrastructure (shared loaders, merge order), but the shared dictionaries only contain 2 keys (`common.skipToContent`, `common.backToTop`). This design expands them to cover all HSE-wide content and restructures the dictionary format.

## Scope

- New categorized dictionary JSON format for all dictionaries (shared and app)
- `flattenCategorized()` runtime utility in `@repo/i18n`
- `FlattenCategorized<T>` compile-time utility type in `@repo/i18n`
- `MergedDictionary<TApp>` utility type in `@repo/i18n` (eliminates per-app type boilerplate)
- Expanded shared dictionaries with footer content, social links, contact info
- Migration of existing flat dictionaries to categorized format
- Updated `SiteFooter` component to read from dictionary instead of hardcoded values
- Updated `DictionaryLoaders` type
- Updated tests and documentation

### Out of scope

- API integration (the backend locale API at `dev.app.hse.ie` may migrate later — the categorized format is forward-compatible but no integration now)
- Loader factory helper (the boilerplate it replaces is minimal)

---

## Dictionary Format

### Categorized structure

All dictionary JSON files use a two-level categorized format:

```json
{
  "category": {
    "key": "value",
    "nested.key": "value"
  }
}
```

The TypeScript type is `Record<string, Record<string, string>>`. This matches the structure of the existing HSE locale API (`dev.app.hse.ie/app/v1/locales/en/`), making future API integration straightforward.

### Shared dictionary (`packages/i18n/dictionaries/en.json`)

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

### App dictionary (`apps/hse-multisite-template/src/dictionaries/en.json`)

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

### Irish shared dictionary (`packages/i18n/dictionaries/ga.json`)

Same structure as `en.json`. Labels and UI text are translated to Irish. URLs, phone numbers, and `href` values stay identical — they are locale-independent data that happens to live in the dictionary for co-location with their labels.

### Override behaviour

An app overrides a shared key by defining the same category and key in its own dictionary. For example, if an app needed a different freephone number:

```json
{
  "footer": {
    "freephone.number": "1800 XXX XXX"
  }
}
```

Only `footer.freephone.number` is overridden — all other shared footer keys are inherited.

---

## Loading Pipeline

### Flattening

A `flattenCategorized()` utility converts categorized format to flat dotted keys:

```
{ "footer": { "social.facebook.label": "HSE Facebook" } }
→ { "footer.social.facebook.label": "HSE Facebook" }
```

This runs inside `loadDictionary` immediately after each dictionary is imported, before merging.

### Merge order (unchanged)

1. Default locale shared dict (flattened)
2. Default locale app dict (flattened)
3. Requested locale shared dict (flattened)
4. Requested locale app dict (flattened)

Last value wins. `loadDictionary` still returns `Record<string, string>` — nothing downstream changes.

### Full transform pipeline

```
Categorized JSON → flattenCategorized() → flat merge → unflatten() → nested dict for components
```

---

## Type System

### `FlattenCategorized<T>` utility type

Compile-time companion to `flattenCategorized()`. Converts `Record<string, Record<string, string>>` to a flat dotted-key type:

```typescript
type FlattenCategorized<T extends Record<string, Record<string, string>>> = {
  [Cat in keyof T & string as `${Cat}.${keyof T[Cat] & string}`]: string;
};
```

### `MergedDictionary<TApp>` utility type

Eliminates per-app type boilerplate. Apps define their `Dictionary` type in one line:

```typescript
import type { MergedDictionary } from "@repo/i18n";
import type app from "@/dictionaries/en.json";

/** Fully typed dictionary available via `useDictionary<Dictionary>()`. */
export type Dictionary = MergedDictionary<typeof app>;
```

Internally, `MergedDictionary<TApp>`:
1. Imports the shared dictionary type
2. Applies `FlattenCategorized` to both shared and app types
3. Merges them (app keys override shared)
4. Applies `Unflatten` to produce the final nested type

### `DictionaryLoaders` type change

```typescript
/** Async loaders that return categorized dictionary modules, keyed by locale. */
export type DictionaryLoaders = Record<
  string,
  () => Promise<{ default: Record<string, Record<string, string>> }>
>;
```

---

## Footer Component Changes

The `SiteFooter` component removes all hardcoded strings and the `SOCIAL_LINKS` constant. It reads everything from the dictionary via `useDictionary<Dictionary>()`:

- `dict.footer.label` — the "HSE Live" heading
- `dict.footer.hours.*` — opening hours (iterated via `Object.entries`)
- `dict.footer.freephone.*` / `dict.footer.international.*` — contact info
- `dict.footer.social.*` — social links (iterated via `Object.entries`)
- `dict.footer.cookieSettings` — cookie button label

The component stays `"use client"` (it uses `useDictionary`, `onClick`, and `asElement={Link}`).

---

## Files Changed

### `@repo/i18n` package (`packages/i18n/`)

| File | Change |
|------|--------|
| `dictionaries/en.json` | Expand with categorized `common` + `footer` content |
| `dictionaries/ga.json` | Expand with Irish translations in categorized format |
| `src/flatten-categorized.ts` | New — runtime `flattenCategorized()` utility |
| `src/flatten-categorized.test.ts` | New — tests for flattening utility |
| `src/types.ts` | Add `FlattenCategorized<T>`, `MergedDictionary<TApp>`, update `DictionaryLoaders` |
| `src/get-dictionary.ts` | Call `flattenCategorized()` on loaded dictionaries |
| `src/get-dictionary.test.ts` | Update mocks to categorized format |
| `src/shared-loaders.ts` | Update return type |
| `src/index.ts` | Export new types and utility |

### App (`apps/hse-multisite-template/`)

| File | Change |
|------|--------|
| `src/dictionaries/en.json` | Convert to categorized format |
| `src/dictionaries/ga.json` | Convert to categorized format |
| `src/lib/i18n/dictionary.ts` | Simplify to use `MergedDictionary<typeof app>` |
| `src/components/site-footer/site-footer.tsx` | Remove hardcoded strings, read from dictionary |

### Tests (updated mocks/format)

All test files with dictionary mocks updated to categorized format.

### Documentation

| File | Change |
|------|--------|
| `docs/superpowers/specs/2026-04-08-i18n-design.md` | Update dictionary format sections |
| `docs/superpowers/plans/2026-04-08-i18n.md` | Update dictionary format in code examples |

---

## Testing

- `flattenCategorized()` — unit tests for basic categories, nested dotted keys, empty objects
- `FlattenCategorized<T>` — type-level tests via `expectTypeOf`
- `loadDictionary` — updated to use categorized mocks, same merge behaviour verified
- `MergedDictionary` — type-level test verifying shared + app merge
- Footer component — verify it renders dictionary content (not hardcoded strings)

---

## Future Considerations

- **HSE locale API integration**: The categorized format matches `dev.app.hse.ie/app/v1/locales/{locale}/`. When the API migrates, shared dictionaries could be populated from API responses with minimal transformation.
- **CMS-driven footer content**: If Wagtail eventually provides social links and contact info via site settings, the footer component can prefer CMS data and fall back to dictionary defaults. No breaking change needed.
