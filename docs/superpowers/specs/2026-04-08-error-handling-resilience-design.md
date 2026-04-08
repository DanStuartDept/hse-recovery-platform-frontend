# Error Handling & Resilience Design — Logging, CMS Error Classification, Zod Validation

**Date:** 2026-04-08
**Backlog item:** #7 — Error Handling and Resilience (remaining items)
**Prior spec:** `2026-04-07-error-handling-design.md` (error pages — done)
**Status:** Draft

---

## Goal

Make CMS failures and data integrity issues visible in logs so DevOps can diagnose problems from log output. No UI changes — the existing error pages and `notFound()` behaviour stay as-is.

Three workstreams:

1. **CMS error classification** — distinguish "page not found" from "CMS is down" in logs
2. **Zod validation logging** — validate CMS responses against schemas, log mismatches without crashing
3. **Logger and error handling audit** — fix all existing logging and error handling across the codebase

---

## 1. `FetchError` enrichment

**File:** `packages/wagtail-cms-client/src/lib/fetch.ts`

Add a required `status` field to `FetchError` carrying the HTTP status code. For network errors (no HTTP response), pass `0`.

```ts
export class FetchError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = `FetchError [${code}]`;
  }
}
```

In `fetchRequest()`:

- HTTP errors: `new FetchError(message, "REQUEST_FAILED", response.status)`
- Network errors: `new FetchError("An unexpected error occurred", "UNEXPECTED_ERROR", 0)`

Update all existing `FetchError` tests to include the `status` parameter.

---

## 2. Logger — add `warn` and `error` levels

**File:** `packages/logger/src/index.ts`

Add `warn()` and `error()` functions alongside existing `log()`:

```ts
export const log = (...args: unknown[]): void => {
  console.log("LOGGER: ", ...args);
};

export const warn = (...args: unknown[]): void => {
  console.warn("LOGGER: ", ...args);
};

export const error = (...args: unknown[]): void => {
  console.error("LOGGER: ", ...args);
};
```

Add tests for `warn` and `error` (same pattern as existing `log` test — spy on `console.warn`/`console.error`).

---

## 3. Catch-all route — CMS error logging + Zod validation

**File:** `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`

### CMS error classification

When `isNotFound(response)` is true, inspect `response.data` to determine the failure type and log at the appropriate level before calling `notFound()`:

| Condition | Level | Message pattern |
|-----------|-------|-----------------|
| No `FetchError` or status 404 | `log` | `[CMS] Page not found: /path/` |
| Status >= 500 | `error` | `[CMS] Server error 503 fetching /path/: <message>` |
| Status 0 (network) | `error` | `[CMS] Unreachable — network error fetching /path/: <message>` |
| Other HTTP status (403, 429, etc.) | `warn` | `[CMS] HTTP 429 fetching /path/: <message>` |

### Zod validation

After confirming the response is not a `NotFoundContents`, validate against `CMSPageContentSchema` using `safeParse`. Log validation issues but render with the raw response regardless:

```ts
const result = CMSPageContentSchema.safeParse(response);
if (!result.success) {
  warn("[CMS] Validation issues for /path/:", result.error.issues);
}
```

Validates base page structure (id, title, meta, breadcrumbs) — not page-type-specific fields. Catches the most impactful structural problems without being brittle to new CMS fields.

---

## 4. Full logging and error handling audit

### 4a. Adjust existing logger usage

| File | Current | Change |
|------|---------|--------|
| `app/[lang]/error.tsx` | `log("ErrorPage:", error)` guarded by `config.isLocalhost` | Change to `error("ErrorPage:", err)`, remove localhost guard |
| `app/global-error.tsx` | `log("GlobalError:", error)` guarded by `config.isLocalhost` | Change to `error("GlobalError:", err)`, remove localhost guard |

Errors should log in all environments. With proper log levels, the runtime/infra controls what gets surfaced.

### 4b. Add logging to silently swallowed errors

| File | Current | Change |
|------|---------|--------|
| `app/sitemap.ts` — `fetchAllPages()` catch block | Empty catch, returns partial results | Add `warn("[Sitemap] CMS fetch failed, returning partial results:", err)` |
| `app/sitemap.ts` — `extractPath()` catch block | Returns `"/"` silently | Add `warn("[Sitemap] Malformed URL, defaulting to /:", htmlUrl)` |

### 4c. Add error handling to unprotected async calls

| File | Call | Change |
|------|------|--------|
| `app/[lang]/layout.tsx` — `loadDictionary()` | No try/catch, crash takes down all pages for the locale | Wrap in try/catch, log `error("[i18n] Dictionary loading failed for locale:", lang)`, re-throw (let error boundary catch) |
| `app/[lang]/[[...slug]]/page.tsx` — `loadDictionary()` in `generateMetadata` | No try/catch | Wrap in try/catch, log and return empty metadata on failure |

### 4d. Consistent log message format

All log messages should follow the pattern: `[Domain] Description: context`

Prefixes:
- `[CMS]` — CMS API fetch and validation
- `[Sitemap]` — sitemap generation
- `[i18n]` — dictionary/locale operations
- `[ErrorPage]` / `[GlobalError]` — error boundary logging

---

## 5. Testing

### FetchError
- Update existing tests to include `status` parameter
- Test that `status` is correctly set for HTTP errors and network errors

### Logger
- Add tests for `warn()` → spies on `console.warn`
- Add tests for `error()` → spies on `console.error`

### Catch-all route
- Mock `cmsClient.findPageByPath` to return `NotFoundContents` with `FetchError` at various statuses (404, 500, 0)
- Verify correct log level is called for each case
- Mock a response that fails `CMSPageContentSchema.safeParse()` — verify `warn` is called but page still renders

### Error boundaries
- Update existing tests: verify `error()` is called (not `log()`) and without localhost guard

### Sitemap
- Test that catch block logs a warning

---

## Out of scope

- UI changes (no new pages, no new components)
- Structured JSON logging / production log drain (#16)
- Sentry or error tracking integration (#16)
- Core Web Vitals / performance monitoring (#16)
- `loading.tsx` / Suspense boundaries
