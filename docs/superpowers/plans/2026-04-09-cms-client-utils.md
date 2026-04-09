# CMS Client Shared Utilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract duplicated CMS utility functions from the app's catch-all page and layout into `@repo/wagtail-api-client` so multiple apps can share them.

**Architecture:** Four functions (`isNotFound`, `slugToPath`, `extractPath`, `logCmsError`) move into `packages/wagtail-cms-client/src/utils/` as standalone exports. `isNotFound` already exists as a private method on `CMSClient` — it gets promoted. `logCmsError` requires adding `@repo/logger` as a dependency. The app files then import from the package instead of defining their own copies.

**Tech Stack:** TypeScript, Vitest, bunchee (build), `@repo/logger`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/wagtail-cms-client/src/utils/is-not-found.ts` | Standalone `isNotFound` type guard |
| Create | `packages/wagtail-cms-client/src/utils/is-not-found.test.ts` | Tests for `isNotFound` |
| Create | `packages/wagtail-cms-client/src/utils/slug-to-path.ts` | Convert Next.js slug array to path string |
| Create | `packages/wagtail-cms-client/src/utils/slug-to-path.test.ts` | Tests for `slugToPath` |
| Create | `packages/wagtail-cms-client/src/utils/extract-path.ts` | Extract pathname from Wagtail `html_url` |
| Create | `packages/wagtail-cms-client/src/utils/extract-path.test.ts` | Tests for `extractPath` |
| Create | `packages/wagtail-cms-client/src/utils/log-cms-error.ts` | Classify and log CMS errors by HTTP status |
| Create | `packages/wagtail-cms-client/src/utils/log-cms-error.test.ts` | Tests for `logCmsError` |
| Modify | `packages/wagtail-cms-client/src/utils/index.ts` | Re-export all new utilities |
| Modify | `packages/wagtail-cms-client/src/index.ts:75-83` | Replace private `isNotFound` method with imported standalone function |
| Modify | `packages/wagtail-cms-client/package.json:41-43` | Add `@repo/logger` to dependencies |
| Modify | `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx:31-120` | Remove local utils, import from `@repo/wagtail-api-client` |
| Modify | `apps/hse-multisite-template/src/app/[lang]/layout.tsx:26-33` | Remove local `isNotFound`, import from `@repo/wagtail-api-client` |

---

### Task 1: `isNotFound` type guard

**Files:**
- Create: `packages/wagtail-cms-client/src/utils/is-not-found.ts`
- Create: `packages/wagtail-cms-client/src/utils/is-not-found.test.ts`
- Modify: `packages/wagtail-cms-client/src/utils/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/wagtail-cms-client/src/utils/is-not-found.test.ts`:

```ts
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { describe, expect, it } from "vitest";
import { isNotFound } from "./is-not-found.js";

describe("isNotFound", () => {
	it("should return true for a valid NotFoundContents object", () => {
		const response: NotFoundContents = { message: "Not found", data: null };
		expect(isNotFound(response)).toBe(true);
	});

	it("should return true when data is an Error", () => {
		const response = { message: "Server error", data: new Error("fail") };
		expect(isNotFound(response)).toBe(true);
	});

	it("should return false for null", () => {
		expect(isNotFound(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isNotFound(undefined)).toBe(false);
	});

	it("should return false for a string", () => {
		expect(isNotFound("not found")).toBe(false);
	});

	it("should return false for an object with only message (no data)", () => {
		expect(isNotFound({ message: "oops" })).toBe(false);
	});

	it("should return false for an object with only data (no message)", () => {
		expect(isNotFound({ data: 123 })).toBe(false);
	});

	it("should return false for an object where message is not a string", () => {
		expect(isNotFound({ message: 42, data: null })).toBe(false);
	});

	it("should return false for a CMS page object", () => {
		const page = { id: 1, title: "Home", meta: { slug: "home" } };
		expect(isNotFound(page)).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/is-not-found.test.ts`
Expected: FAIL — module `./is-not-found.js` does not exist

- [ ] **Step 3: Write the implementation**

Create `packages/wagtail-cms-client/src/utils/is-not-found.ts`:

```ts
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";

/**
 * Type guard that checks whether a CMS response is a `NotFoundContents` error.
 * Matches the shape `{ message: string, data: unknown }` returned by `CMSClient`
 * when a fetch fails or a resource is not found.
 */
export function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null &&
		typeof response === "object" &&
		"message" in response &&
		typeof (response as Record<string, unknown>).message === "string" &&
		"data" in response
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/is-not-found.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Export from the utils barrel**

Modify `packages/wagtail-cms-client/src/utils/index.ts` — add at the top:

```ts
export { isNotFound } from "./is-not-found.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/src/utils/is-not-found.ts packages/wagtail-cms-client/src/utils/is-not-found.test.ts packages/wagtail-cms-client/src/utils/index.ts
git commit -m "feat(wagtail-api-client): export isNotFound type guard from utils"
```

---

### Task 2: `slugToPath` utility

**Files:**
- Create: `packages/wagtail-cms-client/src/utils/slug-to-path.ts`
- Create: `packages/wagtail-cms-client/src/utils/slug-to-path.test.ts`
- Modify: `packages/wagtail-cms-client/src/utils/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/wagtail-cms-client/src/utils/slug-to-path.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slugToPath } from "./slug-to-path.js";

describe("slugToPath", () => {
	it("should return '/' when slug is undefined", () => {
		expect(slugToPath(undefined)).toBe("/");
	});

	it("should return '/' when slug is an empty array", () => {
		expect(slugToPath([])).toBe("/");
	});

	it("should convert a single-segment slug", () => {
		expect(slugToPath(["about"])).toBe("/about/");
	});

	it("should convert a multi-segment slug", () => {
		expect(slugToPath(["services", "mental-health", "supports"])).toBe(
			"/services/mental-health/supports/",
		);
	});

	it("should handle a slug with one segment", () => {
		expect(slugToPath(["contact"])).toBe("/contact/");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/slug-to-path.test.ts`
Expected: FAIL — module `./slug-to-path.js` does not exist

- [ ] **Step 3: Write the implementation**

Create `packages/wagtail-cms-client/src/utils/slug-to-path.ts`:

```ts
/**
 * Converts a Next.js catch-all route slug array into the trailing-slash path
 * format expected by `CMSClient.findPageByPath()`.
 *
 * @example
 * slugToPath(undefined)                        // "/"
 * slugToPath(["about"])                        // "/about/"
 * slugToPath(["services", "mental-health"])    // "/services/mental-health/"
 */
export function slugToPath(slug?: string[]): string {
	if (!slug || slug.length === 0) {
		return "/";
	}
	return `/${slug.join("/")}/`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/slug-to-path.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Export from the utils barrel**

Modify `packages/wagtail-cms-client/src/utils/index.ts` — add:

```ts
export { slugToPath } from "./slug-to-path.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/src/utils/slug-to-path.ts packages/wagtail-cms-client/src/utils/slug-to-path.test.ts packages/wagtail-cms-client/src/utils/index.ts
git commit -m "feat(wagtail-api-client): export slugToPath utility"
```

---

### Task 3: `extractPath` utility

**Files:**
- Create: `packages/wagtail-cms-client/src/utils/extract-path.ts`
- Create: `packages/wagtail-cms-client/src/utils/extract-path.test.ts`
- Modify: `packages/wagtail-cms-client/src/utils/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/wagtail-cms-client/src/utils/extract-path.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractPath } from "./extract-path.js";

describe("extractPath", () => {
	it("should extract the pathname from a valid URL", () => {
		expect(extractPath("https://cms.example.com/about/")).toBe("/about/");
	});

	it("should extract the root path", () => {
		expect(extractPath("https://cms.example.com/")).toBe("/");
	});

	it("should extract a deep nested path", () => {
		expect(
			extractPath("https://cms.example.com/services/mental-health/supports/"),
		).toBe("/services/mental-health/supports/");
	});

	it("should return '/' for a malformed URL", () => {
		expect(extractPath("not-a-url")).toBe("/");
	});

	it("should return '/' for an empty string", () => {
		expect(extractPath("")).toBe("/");
	});

	it("should strip query parameters", () => {
		expect(extractPath("https://cms.example.com/about/?draft=true")).toBe(
			"/about/",
		);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/extract-path.test.ts`
Expected: FAIL — module `./extract-path.js` does not exist

- [ ] **Step 3: Write the implementation**

Create `packages/wagtail-cms-client/src/utils/extract-path.ts`:

```ts
/**
 * Extracts the pathname from a Wagtail `html_url` field.
 * Returns `"/"` if the URL is malformed.
 *
 * @example
 * extractPath("https://cms.example.com/about/")  // "/about/"
 * extractPath("invalid")                          // "/"
 */
export function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		return "/";
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/extract-path.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Export from the utils barrel**

Modify `packages/wagtail-cms-client/src/utils/index.ts` — add:

```ts
export { extractPath } from "./extract-path.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/src/utils/extract-path.ts packages/wagtail-cms-client/src/utils/extract-path.test.ts packages/wagtail-cms-client/src/utils/index.ts
git commit -m "feat(wagtail-api-client): export extractPath utility"
```

---

### Task 4: `logCmsError` utility

**Files:**
- Create: `packages/wagtail-cms-client/src/utils/log-cms-error.ts`
- Create: `packages/wagtail-cms-client/src/utils/log-cms-error.test.ts`
- Modify: `packages/wagtail-cms-client/src/utils/index.ts`
- Modify: `packages/wagtail-cms-client/package.json`

- [ ] **Step 1: Add `@repo/logger` dependency**

In `packages/wagtail-cms-client/package.json`, add to the `"dependencies"` object:

```json
"dependencies": {
    "@repo/logger": "workspace:*",
    "zod": "catalog:"
}
```

Then run: `pnpm install`

- [ ] **Step 2: Write the failing test**

Create `packages/wagtail-cms-client/src/utils/log-cms-error.test.ts`:

```ts
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { describe, expect, it, vi } from "vitest";
import { FetchError } from "../lib/fetch.js";
import { logCmsError } from "./log-cms-error.js";

vi.mock("@repo/logger", () => ({
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}));

// biome-ignore lint/style/noNamespaceImport: need all mocked exports for assertions
import * as logger from "@repo/logger";

describe("logCmsError", () => {
	it("should log at info level for 404 errors", () => {
		const response: NotFoundContents = {
			message: "Not found",
			data: new FetchError("Not found", "REQUEST_FAILED", 404),
		};

		logCmsError("/about/", response);

		expect(logger.log).toHaveBeenCalledWith("[CMS] Page not found: /about/");
	});

	it("should log at error level for 5xx errors", () => {
		const fetchError = new FetchError("Internal error", "REQUEST_FAILED", 500);
		const response: NotFoundContents = {
			message: "Server error",
			data: fetchError,
		};

		logCmsError("/about/", response);

		expect(logger.error).toHaveBeenCalledWith(
			"[CMS] Server error 500 fetching /about/:",
			"Internal error",
		);
	});

	it("should log at error level for network errors (status 0)", () => {
		const fetchError = new FetchError("Network error", "UNEXPECTED_ERROR", 0);
		const response: NotFoundContents = {
			message: "Unreachable",
			data: fetchError,
		};

		logCmsError("/about/", response);

		expect(logger.error).toHaveBeenCalledWith(
			"[CMS] Unreachable — network error fetching /about/:",
			"Network error",
		);
	});

	it("should log at warn level for other HTTP errors", () => {
		const fetchError = new FetchError("Forbidden", "REQUEST_FAILED", 403);
		const response: NotFoundContents = {
			message: "Forbidden",
			data: fetchError,
		};

		logCmsError("/admin/", response);

		expect(logger.warn).toHaveBeenCalledWith(
			"[CMS] HTTP 403 fetching /admin/:",
			"Forbidden",
		);
	});

	it("should log at info level when data is not a FetchError and no status", () => {
		const response: NotFoundContents = {
			message: "Not found",
			data: null,
		};

		logCmsError("/missing/", response);

		expect(logger.log).toHaveBeenCalledWith(
			"[CMS] Page not found: /missing/",
		);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/log-cms-error.test.ts`
Expected: FAIL — module `./log-cms-error.js` does not exist

- [ ] **Step 4: Write the implementation**

Create `packages/wagtail-cms-client/src/utils/log-cms-error.ts`:

```ts
import { log, warn, error as logError } from "@repo/logger";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import { FetchError } from "../lib/fetch.js";

/**
 * Classifies a CMS error by HTTP status and logs at the appropriate severity.
 *
 * - 404 or non-FetchError → `log` (expected, page doesn't exist)
 * - 5xx → `error` (server problem)
 * - status 0 → `error` (network unreachable)
 * - other → `warn` (unexpected client error)
 */
export function logCmsError(path: string, response: NotFoundContents): void {
	const fetchError = response.data instanceof FetchError ? response.data : null;

	if (!fetchError || fetchError.status === 404) {
		log(`[CMS] Page not found: ${path}`);
	} else if (fetchError.status >= 500) {
		logError(
			`[CMS] Server error ${fetchError.status} fetching ${path}:`,
			fetchError.message,
		);
	} else if (fetchError.status === 0) {
		logError(
			`[CMS] Unreachable — network error fetching ${path}:`,
			fetchError.message,
		);
	} else {
		warn(
			`[CMS] HTTP ${fetchError.status} fetching ${path}:`,
			fetchError.message,
		);
	}
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/utils/log-cms-error.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Export from the utils barrel**

Modify `packages/wagtail-cms-client/src/utils/index.ts` — add:

```ts
export { logCmsError } from "./log-cms-error.js";
```

- [ ] **Step 7: Commit**

```bash
git add packages/wagtail-cms-client/src/utils/log-cms-error.ts packages/wagtail-cms-client/src/utils/log-cms-error.test.ts packages/wagtail-cms-client/src/utils/index.ts packages/wagtail-cms-client/package.json pnpm-lock.yaml
git commit -m "feat(wagtail-api-client): export logCmsError utility with logger dependency"
```

---

### Task 5: Refactor `CMSClient` to use standalone `isNotFound`

**Files:**
- Modify: `packages/wagtail-cms-client/src/index.ts:75-83`

- [ ] **Step 1: Run existing tests to establish baseline**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All existing tests PASS

- [ ] **Step 2: Replace the private `isNotFound` method**

In `packages/wagtail-cms-client/src/index.ts`, add the import at the top (after line 22):

```ts
import { isNotFound } from "./utils/index.js";
```

Then remove the private `isNotFound` method (lines 72-83):

```ts
	/**
	 * Type guard to check if a response is a NotFoundContents error.
	 */
	private isNotFound(response: unknown): response is NotFoundContents {
		return (
			response != null &&
			typeof response === "object" &&
			"message" in response &&
			typeof (response as Record<string, unknown>).message === "string" &&
			"data" in response
		);
	}
```

Replace the two call sites that use `this.isNotFound(response)` with `isNotFound(response)`:
- `fetchHeader` (around line 376): `if (this.isNotFound(response))` → `if (isNotFound(response))`
- `fetchFooter` (around line 403): `if (this.isNotFound(response))` → `if (isNotFound(response))`

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All tests PASS (same count as baseline)

- [ ] **Step 4: Commit**

```bash
git add packages/wagtail-cms-client/src/index.ts
git commit -m "refactor(wagtail-api-client): use standalone isNotFound in CMSClient"
```

---

### Task 6: Update app `page.tsx` to use shared utilities

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`

- [ ] **Step 1: Replace local imports and functions**

In `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`:

1. Update the import from `@repo/wagtail-api-client` (currently only `FetchError` is imported indirectly via types). Add to the existing imports:

```ts
import {
	extractPath,
	isNotFound,
	logCmsError,
	slugToPath,
} from "@repo/wagtail-api-client";
```

2. Remove the `FetchError` import from `@repo/wagtail-api-client` (line 4) — it's no longer needed directly since `logCmsError` handles it internally.

3. Remove the `log, error as logError, warn` imports from `@repo/logger` (line 3) — no longer needed since `logCmsError` handles logging.

4. Remove the `warn` import if only used by `extractPath` — check remaining usages. The `warn` in `generateMetadata` (line 145-150) for dictionary loading failure still needs it. Keep `warn` imported from `@repo/logger` if so.

5. Remove these local function definitions:
   - `isNotFound` (lines 31-35)
   - `slugToPath` (lines 37-39)
   - `extractPath` (lines 41-49)
   - `logCmsError` (lines 99-120)

6. Remove the `NotFoundContents` type import from `@repo/wagtail-cms-types/core` (line 12) — no longer needed since the type guard is now imported.

- [ ] **Step 2: Verify the page still type-checks**

Run: `cd apps/hse-multisite-template && pnpm typecheck`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx
git commit -m "refactor(app): use shared CMS utilities from @repo/wagtail-api-client in page"
```

---

### Task 7: Update app `layout.tsx` to use shared `isNotFound`

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/layout.tsx`

- [ ] **Step 1: Replace local `isNotFound` with import**

In `apps/hse-multisite-template/src/app/[lang]/layout.tsx`:

1. Add import:

```ts
import { isNotFound } from "@repo/wagtail-api-client";
```

2. Remove the `NotFoundContents` type import from `@repo/wagtail-cms-types/core` (line 9) — no longer needed.

3. Remove the local `isNotFound` function (lines 26-33):

```ts
function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null &&
		typeof response === "object" &&
		"message" in response &&
		"data" in response
	);
}
```

The two call sites at lines 82 and 89 (`if (isNotFound(headerResponse))` and `if (isNotFound(footerResponse))`) remain unchanged — they now resolve to the imported function.

- [ ] **Step 2: Verify the layout still type-checks**

Run: `cd apps/hse-multisite-template && pnpm typecheck`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/layout.tsx
git commit -m "refactor(app): use shared isNotFound from @repo/wagtail-api-client in layout"
```

---

### Task 8: Build and full test verification

- [ ] **Step 1: Build the wagtail-api-client package**

Run: `pnpm build --filter=@repo/wagtail-api-client`
Expected: Build succeeds, `dist/` output includes the new utils

- [ ] **Step 2: Run all package tests**

Run: `pnpm test --filter=@repo/wagtail-api-client`
Expected: All tests pass (existing + new)

- [ ] **Step 3: Run app type-check**

Run: `pnpm typecheck`
Expected: No type errors across the workspace

- [ ] **Step 4: Run linter**

Run: `pnpm lint`
Expected: No lint errors

- [ ] **Step 5: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "chore: lint fixes after CMS utils extraction"
```
