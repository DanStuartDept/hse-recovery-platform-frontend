# Error Handling & Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CMS failures and data integrity issues visible in logs so DevOps can diagnose problems — no UI changes.

**Architecture:** Enrich `FetchError` with HTTP status, add `warn`/`error` levels to `@repo/logger`, add CMS error classification and Zod validation logging in the catch-all route, and audit all existing logging and error handling across the codebase.

**Tech Stack:** TypeScript, Zod, Next.js 16 App Router, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-error-handling-resilience-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/logger/src/index.ts` | Add `warn` and `error` exports |
| Modify | `packages/logger/src/__tests__/log.test.ts` | Tests for all three log levels |
| Modify | `packages/wagtail-cms-client/src/lib/fetch.ts` | Add `status` field to `FetchError` |
| Modify | `packages/wagtail-cms-client/src/lib/fetch.test.ts` | Update tests for `status` field |
| Modify | `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx` | CMS error classification + Zod validation logging |
| Modify | `apps/hse-multisite-template/src/app/[lang]/error.tsx` | Use `error()`, remove localhost guard |
| Modify | `apps/hse-multisite-template/src/app/[lang]/error.test.tsx` | Update test expectations |
| Modify | `apps/hse-multisite-template/src/app/global-error.tsx` | Use `error()`, remove localhost guard |
| Modify | `apps/hse-multisite-template/src/app/global-error.test.tsx` | Update test expectations |
| Modify | `apps/hse-multisite-template/src/app/sitemap.ts` | Add warning logs to catch blocks |
| Modify | `apps/hse-multisite-template/src/app/[lang]/layout.tsx` | Wrap `loadDictionary` in try/catch with logging |

---

### Task 1: Add `warn` and `error` to `@repo/logger`

**Files:**
- Modify: `packages/logger/src/index.ts`
- Modify: `packages/logger/src/__tests__/log.test.ts`

- [ ] **Step 1: Write failing tests for `warn` and `error`**

Replace the contents of `packages/logger/src/__tests__/log.test.ts`:

```ts
import { error, log, warn } from "..";

describe("@repo/logger", () => {
	it("log writes to console.log", () => {
		vi.spyOn(global.console, "log");
		log("hello");
		expect(console.log).toBeCalledWith("LOGGER: ", "hello");
	});

	it("warn writes to console.warn", () => {
		vi.spyOn(global.console, "warn");
		warn("careful");
		expect(console.warn).toBeCalledWith("LOGGER: ", "careful");
	});

	it("error writes to console.error", () => {
		vi.spyOn(global.console, "error");
		error("broken");
		expect(console.error).toBeCalledWith("LOGGER: ", "broken");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/logger && pnpm vitest run`
Expected: FAIL — `warn` and `error` are not exported

- [ ] **Step 3: Implement `warn` and `error`**

Replace the contents of `packages/logger/src/index.ts`:

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/logger && pnpm vitest run`
Expected: 3 tests PASS

- [ ] **Step 5: Build the package**

Run: `cd packages/logger && pnpm build`
Expected: Build succeeds — `dist/es/index.js` now exports `log`, `warn`, `error`

- [ ] **Step 6: Commit**

```bash
git add packages/logger/src/index.ts packages/logger/src/__tests__/log.test.ts
git commit -m "feat(logger): add warn and error log levels"
```

---

### Task 2: Add `status` field to `FetchError`

**Files:**
- Modify: `packages/wagtail-cms-client/src/lib/fetch.ts`
- Modify: `packages/wagtail-cms-client/src/lib/fetch.test.ts`

- [ ] **Step 1: Write failing test for `status` on `FetchError`**

In `packages/wagtail-cms-client/src/lib/fetch.test.ts`, replace the first `describe("FetchError")` block:

```ts
describe("FetchError", () => {
	it("should create a FetchError with correct properties", () => {
		const error = new FetchError("Test error message", "TEST_ERROR", 500);

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(FetchError);
		expect(error.message).toBe("Test error message");
		expect(error.code).toBe("TEST_ERROR");
		expect(error.status).toBe(500);
		expect(error.name).toBe("FetchError [TEST_ERROR]");
	});

	it("should inherit from Error correctly", () => {
		const error = new FetchError("Test message", "TEST_CODE", 404);

		expect(error instanceof Error).toBe(true);
		expect(error instanceof FetchError).toBe(true);
	});
});
```

- [ ] **Step 2: Run tests to verify the new assertions fail**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`
Expected: FAIL — `FetchError` constructor only accepts 2 args

- [ ] **Step 3: Update `FetchError` and `fetchRequest`**

Replace the contents of `packages/wagtail-cms-client/src/lib/fetch.ts`:

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

/**
 * Performs an HTTP request using the Fetch API and handles response and error cases.
 *
 * @param url - The URL to send the request to.
 * @param init - The request options.
 * @returns A Promise that resolves with the parsed JSON response data.
 * @throws {FetchError} When the request fails or an unexpected error occurs.
 */
export async function fetchRequest<T>(
	url: string,
	init?: RequestInit,
): Promise<T> {
	try {
		const defaultInit = {
			next: {
				revalidate: 360,
			},
		} as RequestInit & { next?: { revalidate?: number } };

		const response = await fetch(url, { ...defaultInit, ...init });

		if (!response.ok) {
			throw new FetchError(
				`Request failed: ${response.status} ${response.statusText} (${response.url})`,
				"REQUEST_FAILED",
				response.status,
			);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof FetchError) {
			throw error;
		}

		throw new FetchError("An unexpected error occurred", "UNEXPECTED_ERROR", 0);
	}
}
```

- [ ] **Step 4: Update remaining `FetchError` test assertions**

Several tests in `fetch.test.ts` construct `FetchError` directly or check its properties. Update these:

In the `"should re-throw FetchError when it occurs during the request"` test, update the `FetchError` construction:

```ts
const originalError = new FetchError("Original error", "ORIGINAL_CODE", 0);
```

In the `"should throw FetchError with REQUEST_FAILED code when response is not ok"` test, add a status assertion inside the catch block, after the existing assertions:

```ts
expect((error as FetchError).status).toBe(404);
```

- [ ] **Step 5: Run all fetch tests**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 6: Run the full package test suite**

Run: `cd packages/wagtail-cms-client && pnpm vitest run`
Expected: All 79 tests PASS (some `CMSClient` tests may need `FetchError` constructor updates — fix any that fail)

- [ ] **Step 7: Build the package**

Run: `cd packages/wagtail-cms-client && pnpm build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add packages/wagtail-cms-client/src/lib/fetch.ts packages/wagtail-cms-client/src/lib/fetch.test.ts
git commit -m "feat(wagtail-api-client): add status field to FetchError"
```

---

### Task 3: CMS error classification and Zod validation in catch-all route

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`

- [ ] **Step 1: Add imports**

In `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`, replace the import block:

```ts
import { config } from "@repo/app-config";
import { loadDictionary } from "@repo/i18n";
import { error as logError, log, warn } from "@repo/logger";
import {
	createCMSRenderer,
	generatePageMetadata,
} from "@repo/wagtail-cms-mapping";
import { CMSPageContentSchema } from "@repo/wagtail-cms-types/core";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FetchError } from "@repo/wagtail-api-client";

import { cmsClient } from "@/lib/cms/client";
import { i18nConfig } from "@/lib/i18n/config";
import { dictionaryLoaders } from "@/lib/i18n/loaders";
```

Note: `error` is aliased to `logError` to avoid shadowing the `error` variable name commonly used in catch blocks.

- [ ] **Step 2: Add the CMS error logging helper**

After the `slugToPath` function, add:

```ts
function logCmsError(path: string, response: NotFoundContents): void {
	const fetchError =
		response.data instanceof FetchError ? response.data : null;

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

- [ ] **Step 3: Update `generateMetadata` to log CMS errors**

Replace the `generateMetadata` function:

```ts
export async function generateMetadata(
	props: PageProps<"/[lang]/[[...slug]]">,
): Promise<Metadata> {
	const { lang, slug } = await props.params;
	const path = slugToPath(slug);
	const response = await cmsClient.findPageByPath(path, {
		next: { revalidate: REVALIDATE_SECONDS },
	});

	if (isNotFound(response)) {
		logCmsError(path, response);
		return {};
	}

	let defaultDescription: string | undefined;
	try {
		const flat = await loadDictionary(
			lang,
			dictionaryLoaders,
			i18nConfig.defaultLocale,
		);
		defaultDescription = flat["meta.defaultDescription"];
	} catch (err) {
		warn("[i18n] Dictionary loading failed in generateMetadata for locale:", lang, err);
	}

	return generatePageMetadata(response as CMSPageProps, {
		siteUrl: config.siteUrl,
		path,
		defaultDescription,
	});
}
```

- [ ] **Step 4: Update `CatchAllPage` to log CMS errors and validate with Zod**

Replace the `CatchAllPage` function:

```ts
export default async function CatchAllPage(
	props: PageProps<"/[lang]/[[...slug]]">,
) {
	const { slug } = await props.params;
	const path = slugToPath(slug);

	const response = await cmsClient.findPageByPath(path, {
		next: { revalidate: REVALIDATE_SECONDS },
	});

	if (isNotFound(response)) {
		logCmsError(path, response);
		notFound();
	}

	const result = CMSPageContentSchema.safeParse(response);
	if (!result.success) {
		warn("[CMS] Validation issues for", path, result.error.issues);
	}

	const renderer = createCMSRenderer({
		apiClient: cmsClient,
		debug: config.isLocalhost,
	});
	return renderer.renderPage(response as CMSPageProps);
}
```

- [ ] **Step 5: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: PASS — all imports resolve

- [ ] **Step 6: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx
git commit -m "feat(app): add CMS error classification and Zod validation logging"
```

---

### Task 4: Update error boundaries — use `error()` level, remove localhost guard

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/error.tsx`
- Modify: `apps/hse-multisite-template/src/app/[lang]/error.test.tsx`
- Modify: `apps/hse-multisite-template/src/app/global-error.tsx`
- Modify: `apps/hse-multisite-template/src/app/global-error.test.tsx`

- [ ] **Step 1: Update `error.tsx` test expectations**

In `apps/hse-multisite-template/src/app/[lang]/error.test.tsx`, update the mock and test:

Replace the logger mock:

```ts
vi.mock("@repo/logger", () => ({ error: vi.fn() }));
```

Replace the logger import:

```ts
import { error } from "@repo/logger";
```

Remove the `@repo/app-config` mock entirely (the line `vi.mock("@repo/app-config", ...)`).

Replace the `"logs the error in localhost environment"` test:

```ts
it("logs the error", () => {
	renderWithProvider(
		<ErrorPage error={testError} unstable_retry={vi.fn()} />,
	);
	expect(error).toHaveBeenCalledWith("[ErrorPage]", testError);
});
```

- [ ] **Step 2: Run the error test to verify it fails**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/\\[lang\\]/error.test.tsx`
Expected: FAIL — `error.tsx` still imports `log` and uses localhost guard

- [ ] **Step 3: Update `error.tsx`**

Replace the contents of `apps/hse-multisite-template/src/app/[lang]/error.tsx`:

```tsx
"use client";

import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { useDictionary } from "@repo/i18n";
import { error as logError } from "@repo/logger";
import { useEffect } from "react";
import type { Dictionary } from "@/lib/i18n/dictionary";

export default function ErrorPage({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	const dict = useDictionary<Dictionary>();

	useEffect(() => {
		logError("[ErrorPage]", error);
	}, [error]);

	return (
		<Container>
			<Row>
				<Col width="two-thirds">
					<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
						{dict.error.heading}
					</h1>
					<p className="hse-body-reg-m">{dict.error.body}</p>
					<button
						type="button"
						className="hse-button"
						onClick={() => unstable_retry()}
					>
						{dict.error.tryAgain}
					</button>
				</Col>
			</Row>
		</Container>
	);
}
```

- [ ] **Step 4: Run error test to verify it passes**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/\\[lang\\]/error.test.tsx`
Expected: 3 tests PASS

- [ ] **Step 5: Update `global-error.tsx` test expectations**

In `apps/hse-multisite-template/src/app/global-error.test.tsx`, update the mock and test:

Replace the logger mock:

```ts
vi.mock("@repo/logger", () => ({ error: vi.fn() }));
```

Replace the logger import:

```ts
import { error } from "@repo/logger";
```

Remove the `@repo/app-config` mock entirely.

Replace the `"logs the error in localhost environment"` test:

```ts
it("logs the error", () => {
	render(<GlobalError error={testError} unstable_retry={vi.fn()} />);
	expect(error).toHaveBeenCalledWith("[GlobalError]", testError);
});
```

- [ ] **Step 6: Run the global-error test to verify it fails**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/global-error.test.tsx`
Expected: FAIL — `global-error.tsx` still imports `log` and uses localhost guard

- [ ] **Step 7: Update `global-error.tsx`**

Replace the contents of `apps/hse-multisite-template/src/app/global-error.tsx`:

```tsx
"use client";

import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { error as logError } from "@repo/logger";
import { useEffect } from "react";
import "@hseireland/hse-frontend/packages/hse.scss";

export default function GlobalError({
	error,
	unstable_retry,
}: {
	error: Error & { digest?: string };
	unstable_retry: () => void;
}) {
	useEffect(() => {
		logError("[GlobalError]", error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<Container>
					<Row>
						<Col width="two-thirds">
							<h1 className="hse-u-margin-bottom-6 hse-u-text-color_hse-grey-900">
								Something went wrong
							</h1>
							<p className="hse-body-reg-m">
								There was a problem loading this page. Please try again.
							</p>
							<button
								type="button"
								className="hse-button"
								onClick={() => unstable_retry()}
							>
								Try again
							</button>
						</Col>
					</Row>
				</Container>
			</body>
		</html>
	);
}
```

- [ ] **Step 8: Run global-error test to verify it passes**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/global-error.test.tsx`
Expected: 4 tests PASS

- [ ] **Step 9: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/error.tsx apps/hse-multisite-template/src/app/[lang]/error.test.tsx apps/hse-multisite-template/src/app/global-error.tsx apps/hse-multisite-template/src/app/global-error.test.tsx
git commit -m "refactor(app): use error log level in error boundaries, remove localhost guard"
```

---

### Task 5: Add logging to sitemap silent catch blocks

**Files:**
- Modify: `apps/hse-multisite-template/src/app/sitemap.ts`

- [ ] **Step 1: Add logger import and update `fetchAllPages` catch block**

In `apps/hse-multisite-template/src/app/sitemap.ts`, add the import after the existing imports:

```ts
import { warn } from "@repo/logger";
```

Replace the catch block in `fetchAllPages` (the `catch {` block around line 41):

```ts
	} catch (err) {
		warn("[Sitemap] CMS fetch failed, returning partial results:", err);
		return allItems;
	}
```

- [ ] **Step 2: Update `extractPath` catch block**

Replace the `extractPath` function:

```ts
function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		warn("[Sitemap] Malformed URL, defaulting to /:", htmlUrl);
		return "/";
	}
}
```

- [ ] **Step 3: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/hse-multisite-template/src/app/sitemap.ts
git commit -m "fix(app): add warning logs to sitemap catch blocks"
```

---

### Task 6: Wrap `loadDictionary` in layout with error handling

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/layout.tsx`

- [ ] **Step 1: Add logger import**

In `apps/hse-multisite-template/src/app/[lang]/layout.tsx`, add the import:

```ts
import { error as logError } from "@repo/logger";
```

- [ ] **Step 2: Wrap `loadDictionary` in try/catch**

Replace the `loadDictionary` call in `RootLayout` (lines 39-43):

```ts
	let flat: Record<string, string>;
	try {
		flat = await loadDictionary(
			lang,
			dictionaryLoaders,
			i18nConfig.defaultLocale,
		);
	} catch (err) {
		logError("[i18n] Dictionary loading failed for locale:", lang, err);
		throw err;
	}
```

The re-throw lets the error boundary (`error.tsx`) handle the UI. The log ensures the cause is captured.

- [ ] **Step 3: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/layout.tsx
git commit -m "fix(app): add error logging for dictionary loading in layout"
```

---

### Task 7: Full suite verification

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All test suites PASS

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS across all packages

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (auto-fixes applied if needed)

- [ ] **Step 4: Run build**

Run: `pnpm build`
Expected: All packages and apps build successfully

- [ ] **Step 5: Commit any lint fixes**

If lint made auto-fixes:

```bash
git add -u
git commit -m "style: apply lint fixes"
```
