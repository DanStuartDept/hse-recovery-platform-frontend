---
sidebar_position: 6
---

# `@repo/logger`

A thin structured logging wrapper around the browser/Node.js console. All application log output should go through this package rather than calling `console` methods directly.

**npm name:** `@repo/logger`  
**Path:** `packages/logger`  
**Build:** bunchee — dual ESM (`dist/es/`) + CJS (`dist/cjs/`)

---

## API

The package exports three functions:

```ts
import { log, warn, error } from "@repo/logger";
```

### `log(...args: unknown[]): void`

Informational messages. Maps to `console.log`. Prefixed with `LOGGER: `.

Use for expected, non-exceptional events: a CMS page not being found (404 is normal), a cache miss, a successful revalidation.

```ts
log("Page fetched:", page.title);
log("[CMS] Page not found:", path);
```

### `warn(...args: unknown[]): void`

Warning messages. Maps to `console.warn`. Prefixed with `LOGGER: `.

Use for unexpected but non-fatal situations: a CMS response that does not match the expected schema, an optional configuration value that is missing, a deprecated usage.

```ts
warn("[CMS] Schema mismatch on page:", page.id, result.error);
warn("GTM ID not configured — analytics disabled");
```

### `error(...args: unknown[]): void`

Error messages. Maps to `console.error`. Prefixed with `LOGGER: `.

Use for server errors (5xx), network failures, and situations that indicate something is genuinely broken and needs investigation.

```ts
error("[CMS] Server error 500 fetching /about/:", message);
error("[CMS] Unreachable — network error:", message);
```

---

## The `LOGGER:` prefix

Every call is prefixed with `LOGGER: ` before your arguments. In server logs this makes it easy to grep for application-level messages and distinguish them from framework noise:

```
LOGGER:  [CMS] Page not found: /old-url/
LOGGER:  [CMS] Schema mismatch on page: 42
LOGGER:  [CMS] Server error 500 fetching /api/data/: Internal Server Error
```

---

## Why use this instead of `console`

1. **Consistent prefix** — Every message is tagged with `LOGGER:`, making it easy to filter application logs from framework and library output.
2. **Discoverability** — Grepping for `@repo/logger` or `LOGGER:` finds all log output in one search. `console.log` calls scattered across files are harder to track.
3. **Future extensibility** — The package is the single point of change if logging behaviour needs to evolve: structured JSON output, external log aggregation, log level filtering, or environment-based silencing can all be added here without touching call sites.
4. **Consistency** — Avoids the common drift between `console.log`, `console.info`, and `console.debug` — the package exposes exactly the three levels the codebase uses.

---

## Severity guidelines

| Situation | Level |
|---|---|
| CMS 404 (page genuinely does not exist) | `log` |
| Successful background operation (revalidation, cache write) | `log` |
| CMS response fails Zod validation (schema mismatch) | `warn` |
| Optional config missing (analytics disabled) | `warn` |
| CMS 5xx server error | `error` |
| Network unreachable (status 0) | `error` |
| Unhandled exception in an error boundary | `error` |

---

## CMS error classification

`@repo/wagtail-api-client` exports `logCmsError()` which uses this package to log CMS errors at the correct severity based on HTTP status code:

```ts
import { logCmsError } from "@repo/wagtail-api-client";

const page = await client.findPageByPath(path);
if (isNotFound(page)) {
  logCmsError(path, page);
  notFound();
}
```

This internally calls `log` for 404s, `error` for 5xx and network errors, and `warn` for other unexpected HTTP status codes.

---

## Usage example

```ts
import { log, warn, error } from "@repo/logger";

// Informational
log("Revalidation triggered for path:", path);

// Warning
warn("Dictionary key missing for locale:", locale, "key:", key);

// Error
error("Failed to load header from CMS:", fetchError.message);
```
