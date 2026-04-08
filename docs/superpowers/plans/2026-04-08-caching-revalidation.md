# Caching and Revalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add webhook-triggered on-demand cache revalidation and static pre-rendering of CMS pages to the `hse-multisite-template` app.

**Architecture:** A GET route handler at `/api/revalidate/` accepts a path and token from Wagtail's publish webhook, validates the token against `serverConfig.revalidateToken`, and calls `revalidatePath()`. The catch-all page route adds `generateStaticParams()` to pre-render all CMS pages at build time across all locales, with `dynamicParams = true` for pages published after the build. ISR interval increases from 360s to 3600s (1 hour) since the webhook handles real-time updates.

**Tech Stack:** Next.js 16 App Router (route handlers, `revalidatePath`, `generateStaticParams`), `@repo/app-config`, `@repo/wagtail-api-client`, `@repo/logger`, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-caching-revalidation-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/hse-multisite-template/src/app/api/revalidate/route.ts` | Create | Revalidation webhook endpoint |
| `apps/hse-multisite-template/src/app/api/revalidate/route.test.ts` | Create | Tests for the revalidation endpoint |
| `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx` | Modify | Add `generateStaticParams`, `dynamicParams`, update ISR interval |
| `packages/wagtail-cms-client/src/lib/fetch.ts` | Modify | Update default `next.revalidate` from 360 to 3600 |
| `packages/wagtail-cms-client/src/lib/fetch.test.ts` | Modify | Update expected revalidate values in assertions |

---

### Task 1: Create the revalidation route handler — tests first

**Files:**
- Create: `apps/hse-multisite-template/src/app/api/revalidate/route.test.ts`
- Create: `apps/hse-multisite-template/src/app/api/revalidate/route.ts`

- [ ] **Step 1: Write failing tests for the revalidation route**

Create `apps/hse-multisite-template/src/app/api/revalidate/route.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @repo/app-config/server before importing the route
vi.mock("@repo/app-config/server", () => ({
	serverConfig: { revalidateToken: "test-secret-token", previewToken: "" },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Mock @repo/logger
vi.mock("@repo/logger", () => ({
	log: vi.fn(),
	warn: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { GET } from "./route";

function createRequest(params: Record<string, string>): Request {
	const url = new URL("http://localhost:3000/api/revalidate/");
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return new Request(url);
}

describe("GET /api/revalidate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when token is missing", async () => {
		const request = createRequest({ path: "/about/" });
		const response = await GET(request);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid revalidation token");
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("returns 401 when token is invalid", async () => {
		const request = createRequest({ path: "/about/", token: "wrong-token" });
		const response = await GET(request);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid revalidation token");
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("returns 400 when path is missing", async () => {
		const request = createRequest({ token: "test-secret-token" });
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({
			revalidated: false,
			now: expect.any(Number),
			message: "Missing path to revalidate",
		});
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("revalidates the path and returns 200 on success", async () => {
		const request = createRequest({
			path: "/about/",
			token: "test-secret-token",
		});
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			revalidated: true,
			now: expect.any(Number),
		});
		expect(revalidatePath).toHaveBeenCalledWith("/about/");
	});

	it("sets Cache-Control: no-cache on all responses", async () => {
		const request = createRequest({
			path: "/about/",
			token: "test-secret-token",
		});
		const response = await GET(request);

		expect(response.headers.get("Cache-Control")).toBe("no-cache");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/api/revalidate/route.test.ts`

Expected: FAIL — `route.ts` does not exist yet.

- [ ] **Step 3: Implement the revalidation route handler**

Create `apps/hse-multisite-template/src/app/api/revalidate/route.ts`:

```typescript
import { serverConfig } from "@repo/app-config/server";
import { log, warn } from "@repo/logger";
import { revalidatePath } from "next/cache";

const HEADERS = { "Cache-Control": "no-cache" };

export async function GET(request: Request): Promise<Response> {
	const { searchParams } = new URL(request.url);
	const path = searchParams.get("path");
	const token = searchParams.get("token");

	if (token !== serverConfig.revalidateToken) {
		warn("[Revalidate] Invalid token attempt");
		return new Response("Invalid revalidation token", {
			status: 401,
			headers: HEADERS,
		});
	}

	if (!path) {
		return Response.json(
			{ revalidated: false, now: Date.now(), message: "Missing path to revalidate" },
			{ headers: HEADERS, status: 400 },
		);
	}

	revalidatePath(path);
	log("[Revalidate] Revalidated:", path);

	return Response.json(
		{ revalidated: true, now: Date.now() },
		{ headers: HEADERS },
	);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/hse-multisite-template && pnpm vitest run src/app/api/revalidate/route.test.ts`

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hse-multisite-template/src/app/api/revalidate/route.ts apps/hse-multisite-template/src/app/api/revalidate/route.test.ts
git commit -m "feat(apps): add on-demand revalidation API route for Wagtail webhook"
```

---

### Task 2: Update ISR interval in the fetch layer

**Files:**
- Modify: `packages/wagtail-cms-client/src/lib/fetch.ts:27`
- Modify: `packages/wagtail-cms-client/src/lib/fetch.test.ts` (lines 50, 72, 95, 224)

- [ ] **Step 1: Update the test assertions first**

In `packages/wagtail-cms-client/src/lib/fetch.test.ts`, change all `revalidate: 360` assertions to `revalidate: 3600`. There are four occurrences at lines 50, 72, 95, and 224.

Line 50:
```typescript
		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
		});
```

Line 72:
```typescript
		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
```

Line 95:
```typescript
		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
			method: "GET",
		});
```

Line 224:
```typescript
		expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
			next: { revalidate: 3600 },
		});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`

Expected: FAIL — 4 tests fail because `fetch.ts` still uses `revalidate: 360`.

- [ ] **Step 3: Update the default revalidation interval**

In `packages/wagtail-cms-client/src/lib/fetch.ts`, change line 27 from:

```typescript
				revalidate: 360,
```

to:

```typescript
				revalidate: 3600,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetch.test.ts`

Expected: All 12 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-client/src/lib/fetch.ts packages/wagtail-cms-client/src/lib/fetch.test.ts
git commit -m "feat(packages): increase default ISR revalidation to 1 hour"
```

---

### Task 3: Add `generateStaticParams` and update ISR in the catch-all route

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`

- [ ] **Step 1: Update `REVALIDATE_SECONDS` from 360 to 3600**

In `apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx`, change line 19-20 from:

```typescript
/** ISR revalidation interval in seconds (6 minutes). */
const REVALIDATE_SECONDS = 360;
```

to:

```typescript
/** ISR revalidation interval in seconds (1 hour). On-demand revalidation via webhook handles real-time updates. */
const REVALIDATE_SECONDS = 3600;
```

- [ ] **Step 2: Add `dynamicParams` export**

Add after the imports and before `REVALIDATE_SECONDS`:

```typescript
/**
 * Allow pages not returned by generateStaticParams to be rendered on-demand.
 * New pages published after the last build are server-rendered on first visit, then cached.
 */
export const dynamicParams = true;
```

- [ ] **Step 3: Add `generateStaticParams` function**

Add the following after the `dynamicParams` export and before `REVALIDATE_SECONDS`. This reuses the same pagination pattern from `sitemap.ts`:

```typescript
/**
 * Pre-renders all published CMS pages at build time for every configured locale.
 * Pages are served as static HTML with ISR revalidation as a safety net.
 */
export async function generateStaticParams(): Promise<
	Array<{ lang: string; slug?: string[] }>
> {
	const params: Array<{ lang: string; slug?: string[] }> = [];

	for (const locale of i18nConfig.locales) {
		let offset = 0;
		const PAGE_SIZE = 20;

		try {
			for (;;) {
				const batch = await cmsClient.fetchPages<CMSPageContents>({
					locale,
					limit: PAGE_SIZE,
					offset,
				});

				for (const page of batch.items) {
					const path = extractPath(page.meta.html_url);
					const segments = path.split("/").filter(Boolean);

					params.push({
						lang: locale,
						slug: segments.length > 0 ? segments : undefined,
					});
				}

				if (batch.items.length === 0 || offset + batch.items.length >= batch.meta.total_count) {
					break;
				}

				offset += batch.items.length;
			}
		} catch (err) {
			warn("[generateStaticParams] CMS fetch failed for locale", locale, err);
		}
	}

	return params;
}
```

- [ ] **Step 4: Add the `extractPath` helper function**

Add after the `slugToPath` function:

```typescript
/** Extracts the path portion from a Wagtail `html_url`. */
function extractPath(htmlUrl: string): string {
	try {
		return new URL(htmlUrl).pathname;
	} catch {
		warn("[CMS] Malformed html_url, defaulting to /:", htmlUrl);
		return "/";
	}
}
```

- [ ] **Step 5: Add missing imports**

The `CMSPageContents` type and `warn` are needed. Update the import block:

Add to the `@repo/wagtail-cms-types/core` import:

```typescript
import type { NotFoundContents, CMSPageContents } from "@repo/wagtail-cms-types/core";
```

The `warn` import from `@repo/logger` is already present (line 3).

- [ ] **Step 6: Run typecheck to verify compilation**

Run: `turbo run typecheck --filter=hse-multisite-template`

Expected: PASS — no type errors.

- [ ] **Step 7: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/[[...slug]]/page.tsx
git commit -m "feat(apps): add generateStaticParams for static pre-rendering of CMS pages"
```

---

### Task 4: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`

Expected: All tests PASS across all packages. Pay attention to:
- `packages/wagtail-cms-client` — updated revalidate assertions
- `apps/hse-multisite-template` — new revalidation route tests + existing tests still pass

- [ ] **Step 2: Run typecheck across the workspace**

Run: `pnpm typecheck`

Expected: PASS — no type errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: PASS (or auto-fixes applied).

---

### Task 5: Update backlog

**Files:**
- Modify: `docs/repo-backlog-and-improvements.md`

- [ ] **Step 1: Mark caching items as done in section 8**

In `docs/repo-backlog-and-improvements.md`, update section 8 to strike through the completed items:

```markdown
## 8. Caching and Revalidation Strategy ✅

**Done.** ISR revalidation on CMS fetches (1-hour TTL), localhost fetch logging, and webhook-triggered on-demand revalidation via `revalidatePath`. Static pre-rendering of all CMS pages via `generateStaticParams` with `dynamicParams = true` for new pages.

- ~~`fetch()` cache and `revalidate` settings for CMS API calls~~
- ~~Localhost fetch logging (`logging.fetches.fullUrl`) for debugging cache behaviour~~
- ~~Cache invalidation when content is published in Wagtail (webhook-triggered revalidation via `revalidateTag` or `revalidatePath`)~~
- ~~Per-environment cache configuration (aggressive in prod, minimal in dev/preview)~~
```

- [ ] **Step 2: Update the summary table**

Change the row for item 8 in the summary table:

```markdown
| 8   | ~~[Caching and Revalidation Strategy](#8-caching-and-revalidation-strategy)~~ | ~~Must~~              | ~~L~~       | Done                        |
```

- [ ] **Step 3: Update item 11 dependencies**

In the summary table, update item 11's "Depends on" column to reflect #8 is done. Change:

```markdown
| 11  | [Expand `hse-multisite-template`](#11-expand-hse-multisite-template)          | Must                  | XL          | #2, #5, #6, ~~#7~~, ~~#8~~, #9, #10 |
```

Also update the dependency line in section 11:

```markdown
**Depends on**: ~~#2~~, ~~#5~~, #6, ~~#7~~, ~~#8~~, #9, #10 — these packages and patterns need to exist before the template can integrate them.
```

- [ ] **Step 4: Mark ISR and webhook template items as done in section 11**

In section 11, the ISR item is already struck through. No additional changes needed there.

- [ ] **Step 5: Commit**

```bash
git add docs/repo-backlog-and-improvements.md
git commit -m "docs: mark caching and revalidation (#8) as done in backlog"
```
