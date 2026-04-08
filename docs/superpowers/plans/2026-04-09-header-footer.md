# Header & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CMS-driven header and footer to the multisite template app using the HSE design system components and Wagtail custom API endpoints.

**Architecture:** Replace the existing (unused) site settings Zod schemas with new schemas matching the live `/api/headers/` and `/api/footers/` endpoints. Add `fetchHeader()` / `fetchFooter()` methods to `CMSClient`. Create app-level Server Components that map CMS data to the design system's compound `Header` and `Footer` components, with `next/link` passed via the `asElement` prop. Fetch both in the layout and render with graceful fallbacks (logo-only header, copyright-only footer) if the CMS is unreachable.

**Tech Stack:** Next.js 16, React 19, Zod, `@hseireland/hse-frontend-react`, `@repo/wagtail-api-client`, `@repo/wagtail-cms-types`, `@repo/logger`

**Spec:** `docs/superpowers/specs/2026-04-09-header-footer-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Replace | `packages/wagtail-cms-types/src/types/settings/index.ts` | New Zod schemas for header/footer API responses |
| Modify | `packages/wagtail-cms-client/src/index.ts` | Add `fetchBaseEndpoint`, `fetchHeader`, `fetchFooter` to `CMSClient` |
| Modify | `packages/wagtail-cms-client/src/index.test.ts` | Tests for the new methods |
| Create | `apps/hse-multisite-template/src/components/site-header.tsx` | Maps `CMSHeaderResponse` → design system `Header` |
| Create | `apps/hse-multisite-template/src/components/site-footer.tsx` | Maps `CMSFooterResponse` → design system `Footer` |
| Modify | `apps/hse-multisite-template/src/app/[lang]/layout.tsx` | Fetch and render header/footer |

---

### Task 1: Replace settings schemas in `@repo/wagtail-cms-types`

**Files:**
- Replace: `packages/wagtail-cms-types/src/types/settings/index.ts`

- [ ] **Step 1: Replace the settings schemas file**

Replace the entire contents of `packages/wagtail-cms-types/src/types/settings/index.ts` with schemas matching the live API:

```typescript
import { z } from "zod";

/**
 * Navigation link schema for header primary navigation items.
 * Used in the `navigation_links` array of the header API response.
 * Contains a `page` field that references a Wagtail page ID (null for external links).
 */
export const CMSHeaderNavLinkSchema = z.object({
	/** Unique identifier for this navigation link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the navigation list. */
	sort_order: z.number(),
	/** Display text for the navigation link. */
	label: z.string(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
	/** Wagtail page ID if this link references an internal page, null for external links. */
	page: z.number().nullable(),
});

export type CMSHeaderNavLink = z.infer<typeof CMSHeaderNavLinkSchema>;

/**
 * Navigation link schema for header secondary and mobile navigation items.
 * Used in `navigation_secondary_links` and `header_mobile_links` arrays.
 * Same shape as {@link CMSHeaderNavLinkSchema} but without the `page` field.
 */
export const CMSHeaderSecondaryNavLinkSchema = z.object({
	/** Unique identifier for this navigation link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the navigation list. */
	sort_order: z.number(),
	/** Display text for the navigation link. */
	label: z.string(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
});

export type CMSHeaderSecondaryNavLink = z.infer<
	typeof CMSHeaderSecondaryNavLinkSchema
>;

/**
 * Link schema for footer navigation items.
 * Used in `footer_links` and `footer_secondary_links` arrays.
 * Uses `link_label` (not `label`) for the display text.
 */
export const CMSFooterLinkSchema = z.object({
	/** Unique identifier for this footer link. */
	id: z.number(),
	/** Wagtail translation key for i18n support. */
	translation_key: z.string(),
	/** Sort position within the footer link list. */
	sort_order: z.number(),
	/** Full URL the link points to. */
	link_url: z.string(),
	/** Display text for the footer link. */
	link_label: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Snippet ID this link belongs to. */
	snippet: z.number(),
});

export type CMSFooterLink = z.infer<typeof CMSFooterLinkSchema>;

/**
 * Complete header configuration returned by the CMS `/api/headers/` endpoint.
 * Contains primary navigation, secondary links, mobile-specific links, and header settings.
 */
export const CMSHeaderResponseSchema = z.object({
	/** Unique identifier for this header configuration. */
	id: z.number(),
	/** Internal name for the header snippet in the CMS. */
	name: z.string(),
	/** Service name displayed alongside the logo (empty string if not set). */
	service_name: z.string(),
	/** Whether to display the service name in long format. */
	service_long_name: z.boolean(),
	/** Whether this is a transactional header (minimal navigation). */
	transactional: z.boolean(),
	/** Custom ARIA label for the logo, overriding the default. */
	logo_aria: z.string().nullable(),
	/** Whether to display the search bar in the header. */
	show_search: z.boolean(),
	/** Placeholder text for the search input field. */
	search_prompt_text: z.string(),
	/** Descriptive text for the navigation (used for ARIA). */
	navigation_text: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Custom URL for the logo link (null uses default homepage). */
	logo_link: z.string().nullable(),
	/** Primary navigation links displayed in the main menu. */
	navigation_links: z.array(CMSHeaderNavLinkSchema),
	/** Secondary navigation links displayed in the utility menu. */
	navigation_secondary_links: z.array(CMSHeaderSecondaryNavLinkSchema),
	/** Navigation links shown on mobile devices. */
	header_mobile_links: z.array(CMSHeaderSecondaryNavLinkSchema),
});

export type CMSHeaderResponse = z.infer<typeof CMSHeaderResponseSchema>;

/**
 * Complete footer configuration returned by the CMS `/api/footers/` endpoint.
 * Contains primary footer links and secondary (legal/policy) links.
 */
export const CMSFooterResponseSchema = z.object({
	/** Unique identifier for this footer configuration. */
	id: z.number(),
	/** Internal name for the footer snippet in the CMS. */
	name: z.string(),
	/** Locale identifier (numeric). */
	locale: z.number(),
	/** Primary footer links (e.g., complaints, emergencies). */
	footer_links: z.array(CMSFooterLinkSchema),
	/** Secondary footer links (e.g., privacy, cookies, accessibility). */
	footer_secondary_links: z.array(CMSFooterLinkSchema),
});

export type CMSFooterResponse = z.infer<typeof CMSFooterResponseSchema>;

/**
 * Raw API response schema for the `/api/headers/` endpoint.
 * Returns an array of header configurations (typically one item).
 */
export const CMSHeaderAPIResponseSchema = z.array(CMSHeaderResponseSchema);

export type CMSHeaderAPIResponse = z.infer<typeof CMSHeaderAPIResponseSchema>;

/**
 * Raw API response schema for the `/api/footers/` endpoint.
 * Returns an array of footer configurations (typically one item).
 */
export const CMSFooterAPIResponseSchema = z.array(CMSFooterResponseSchema);

export type CMSFooterAPIResponse = z.infer<typeof CMSFooterAPIResponseSchema>;
```

- [ ] **Step 2: Run typecheck to verify no downstream breakages**

Run: `turbo run typecheck --filter=@repo/wagtail-cms-types`
Expected: PASS — no other source files import the old settings types.

- [ ] **Step 3: Commit**

```bash
git add packages/wagtail-cms-types/src/types/settings/index.ts
git commit -m "feat(wagtail-cms-types): replace settings schemas with header/footer API schemas"
```

---

### Task 2: Add `fetchHeader` and `fetchFooter` to `CMSClient`

**Files:**
- Modify: `packages/wagtail-cms-client/src/index.ts`
- Modify: `packages/wagtail-cms-client/src/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Add the following test blocks to `packages/wagtail-cms-client/src/index.test.ts`, inside the existing `describe("CMSClient", ...)` block, after the last existing `describe` block:

```typescript
describe("fetchHeader", () => {
	it("should return the first header from the API response", async () => {
		const headerData = {
			id: 1,
			name: "Org Header",
			service_name: "",
			service_long_name: false,
			transactional: false,
			logo_aria: null,
			show_search: false,
			search_prompt_text: "Search",
			navigation_text: "Main navigation",
			locale: 1,
			logo_link: null,
			navigation_links: [],
			navigation_secondary_links: [],
			header_mobile_links: [],
		};
		mockFetchRequest.mockResolvedValue([headerData]);

		const result = await client.fetchHeader();

		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/headers/",
			undefined,
		);
		expect(result).toEqual(headerData);
	});

	it("should return NotFoundContents when the API returns an empty array", async () => {
		mockFetchRequest.mockResolvedValue([]);

		const result = await client.fetchHeader();

		expect(result).toEqual({
			message: "Header not found",
			data: [],
		});
	});

	it("should return NotFoundContents when the fetch fails", async () => {
		mockFetchRequest.mockRejectedValue(
			new libModule.FetchError("Server error", "REQUEST_FAILED", 500),
		);

		const result = await client.fetchHeader();

		expect(result).toEqual({
			message: "Header not found",
			data: expect.any(libModule.FetchError),
		});
	});

	it("should pass init options to fetchRequest", async () => {
		const headerData = {
			id: 1,
			name: "Org Header",
			service_name: "",
			service_long_name: false,
			transactional: false,
			logo_aria: null,
			show_search: false,
			search_prompt_text: "Search",
			navigation_text: "Main navigation",
			locale: 1,
			logo_link: null,
			navigation_links: [],
			navigation_secondary_links: [],
			header_mobile_links: [],
		};
		const init = { next: { revalidate: 3600 } } as RequestInit;
		mockFetchRequest.mockResolvedValue([headerData]);

		await client.fetchHeader(init);

		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/headers/",
			init,
		);
	});
});

describe("fetchFooter", () => {
	it("should return the first footer from the API response", async () => {
		const footerData = {
			id: 1,
			name: "Org Footer",
			locale: 1,
			footer_links: [],
			footer_secondary_links: [],
		};
		mockFetchRequest.mockResolvedValue([footerData]);

		const result = await client.fetchFooter();

		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/footers/",
			undefined,
		);
		expect(result).toEqual(footerData);
	});

	it("should return NotFoundContents when the API returns an empty array", async () => {
		mockFetchRequest.mockResolvedValue([]);

		const result = await client.fetchFooter();

		expect(result).toEqual({
			message: "Footer not found",
			data: [],
		});
	});

	it("should return NotFoundContents when the fetch fails", async () => {
		mockFetchRequest.mockRejectedValue(
			new libModule.FetchError("Server error", "REQUEST_FAILED", 500),
		);

		const result = await client.fetchFooter();

		expect(result).toEqual({
			message: "Footer not found",
			data: expect.any(libModule.FetchError),
		});
	});

	it("should pass init options to fetchRequest", async () => {
		const footerData = {
			id: 1,
			name: "Org Footer",
			locale: 1,
			footer_links: [],
			footer_secondary_links: [],
		};
		const init = { next: { revalidate: 3600 } } as RequestInit;
		mockFetchRequest.mockResolvedValue([footerData]);

		await client.fetchFooter(init);

		expect(mockFetchRequest).toHaveBeenCalledWith(
			"https://api.example.com/api/footers/",
			init,
		);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/index.test.ts`
Expected: FAIL — `client.fetchHeader` and `client.fetchFooter` do not exist.

- [ ] **Step 3: Implement the methods**

In `packages/wagtail-cms-client/src/index.ts`, add three methods to the `CMSClient` class. Add them after the existing `fetchDocument` method (around line 250), before `fetchPages`:

```typescript
/**
 * Fetches an endpoint relative to the base URL, bypassing the API path prefix.
 * Used for custom Wagtail endpoints outside the standard `/api/v2/` path
 * (e.g., `/api/headers/`, `/api/footers/`).
 *
 * @param path - The path relative to the base URL (e.g., `api/headers/`).
 * @param init - Optional request options (e.g., ISR revalidation).
 * @returns Promise that resolves with the parsed JSON response data.
 */
private async fetchBaseEndpoint<T>(
	path: string,
	init?: RequestInit,
): Promise<T | NotFoundContents> {
	const url = `${this.baseURL}/${path}`;
	try {
		return (await fetchRequest(url, init)) as T;
	} catch (error) {
		return this.handleFetchError(error, "Path not found");
	}
}

/**
 * Fetches the site header configuration from the CMS.
 * Calls the `/api/headers/` endpoint and returns the first item from the array.
 *
 * @param init - Optional request options (e.g., ISR revalidation).
 * @returns The header configuration, or `NotFoundContents` if the fetch fails or the array is empty.
 */
public async fetchHeader(
	init?: RequestInit,
): Promise<CMSHeaderResponse | NotFoundContents> {
	const response = await this.fetchBaseEndpoint<CMSHeaderAPIResponse>(
		"api/headers/",
		init,
	);

	if (this.isNotFound(response)) {
		return { message: "Header not found", data: response.data };
	}

	const first = response[0];
	if (!first) {
		return { message: "Header not found", data: response };
	}
	return first;
}

/**
 * Fetches the site footer configuration from the CMS.
 * Calls the `/api/footers/` endpoint and returns the first item from the array.
 *
 * @param init - Optional request options (e.g., ISR revalidation).
 * @returns The footer configuration, or `NotFoundContents` if the fetch fails or the array is empty.
 */
public async fetchFooter(
	init?: RequestInit,
): Promise<CMSFooterResponse | NotFoundContents> {
	const response = await this.fetchBaseEndpoint<CMSFooterAPIResponse>(
		"api/footers/",
		init,
	);

	if (this.isNotFound(response)) {
		return { message: "Footer not found", data: response.data };
	}

	const first = response[0];
	if (!first) {
		return { message: "Footer not found", data: response };
	}
	return first;
}
```

Also add a private `isNotFound` helper method (before the new methods):

```typescript
/**
 * Type guard to check if a response is a NotFoundContents error.
 */
private isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null &&
		typeof response === "object" &&
		"message" in response &&
		"data" in response
	);
}
```

Add the required imports at the top of the file:

```typescript
import type {
	CMSHeaderAPIResponse,
	CMSHeaderResponse,
	CMSFooterAPIResponse,
	CMSFooterResponse,
} from "@repo/wagtail-cms-types/settings";
```

Note: `NotFoundContents` is already imported from `@repo/wagtail-cms-types/core`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/wagtail-cms-client && pnpm vitest run src/index.test.ts`
Expected: All tests PASS (existing + new).

- [ ] **Step 5: Run build and typecheck**

Run: `turbo run build typecheck --filter=@repo/wagtail-api-client`
Expected: Build succeeds, no type errors.

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-client/src/index.ts packages/wagtail-cms-client/src/index.test.ts
git commit -m "feat(wagtail-api-client): add fetchHeader and fetchFooter methods to CMSClient"
```

---

### Task 3: Create `SiteHeader` component

**Files:**
- Create: `apps/hse-multisite-template/src/components/site-header.tsx`

- [ ] **Step 1: Create the SiteHeader component**

Create `apps/hse-multisite-template/src/components/site-header.tsx`:

```tsx
import { Header } from "@hseireland/hse-frontend-react";
import type { CMSHeaderResponse } from "@repo/wagtail-cms-types/settings";
import Link from "next/link";

/**
 * Props for the {@link SiteHeader} component.
 */
interface SiteHeaderProps {
	/** Header data from the CMS, or null to render the logo-only fallback. */
	data: CMSHeaderResponse | null;
}

/**
 * Site header component that maps CMS header data to the HSE design system Header.
 * Renders a logo-only fallback when CMS data is unavailable.
 */
export function SiteHeader({ data }: SiteHeaderProps) {
	if (!data) {
		return (
			<Header>
				<Header.Logo asElement={Link} href="/" ariaLabel="HSE - homepage" />
			</Header>
		);
	}

	return (
		<Header>
			<Header.Logo
				asElement={Link}
				href={data.logo_link ?? "/"}
				ariaLabel={data.logo_aria ?? "HSE - homepage"}
			/>
			{data.navigation_secondary_links.length > 0 && (
				<Header.UtilityMenu ariaLabel="Utility menu">
					{data.navigation_secondary_links.map((link) => (
						<Header.UtilityMenu.Item
							key={link.id}
							href={link.link_url}
						>
							{link.label}
						</Header.UtilityMenu.Item>
					))}
				</Header.UtilityMenu>
			)}
			{data.navigation_links.length > 0 && (
				<Header.MainMenu ariaLabel={data.navigation_text || "Main menu"}>
					{data.navigation_links.map((link) => (
						<Header.MainMenu.Item
							key={link.id}
							href={link.link_url}
						>
							{link.label}
						</Header.MainMenu.Item>
					))}
				</Header.MainMenu>
			)}
			{data.header_mobile_links.length > 0 && (
				<Header.MobileMenu ariaLabel="Priority links">
					{data.header_mobile_links.map((link) => (
						<Header.MobileMenu.Item
							key={link.id}
							href={link.link_url}
						>
							{link.label}
						</Header.MobileMenu.Item>
					))}
				</Header.MobileMenu>
			)}
		</Header>
	);
}
```

**Note on `asElement={Link}`:** The HSE design system supports `asElement` on all link items. During implementation, if `next/link` causes issues with the Header compound component (as the user flagged from prior experience), debug by:
1. Checking the browser console for hydration mismatches
2. Trying `asElement` only on the Logo first, then adding to menu items incrementally
3. If `asElement` doesn't work on menu items, fall back to plain `href` strings (losing client-side navigation but keeping functionality)

- [ ] **Step 2: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/components/site-header.tsx
git commit -m "feat(app): add SiteHeader component mapping CMS data to design system Header"
```

---

### Task 4: Create `SiteFooter` component

**Files:**
- Create: `apps/hse-multisite-template/src/components/site-footer.tsx`

- [ ] **Step 1: Create the SiteFooter component**

Create `apps/hse-multisite-template/src/components/site-footer.tsx`:

```tsx
import { Footer } from "@hseireland/hse-frontend-react";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";

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
	if (!data) {
		return (
			<Footer>
				<Footer.Bottom>
					<Footer.Copyright />
				</Footer.Bottom>
			</Footer>
		);
	}

	return (
		<Footer>
			{data.footer_links.length > 0 && (
				<Footer.Top>
					<Footer.Content>
						{data.footer_links.map((link) => (
							<Footer.ListItem
								key={link.id}
								href={link.link_url}
							>
								{link.link_label}
							</Footer.ListItem>
						))}
					</Footer.Content>
				</Footer.Top>
			)}
			<Footer.Bottom>
				{data.footer_secondary_links.map((link) => (
					<Footer.ListItem
						key={link.id}
						href={link.link_url}
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
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/hse-multisite-template/src/components/site-footer.tsx
git commit -m "feat(app): add SiteFooter component mapping CMS data to design system Footer"
```

---

### Task 5: Integrate header and footer into the layout

**Files:**
- Modify: `apps/hse-multisite-template/src/app/[lang]/layout.tsx`

- [ ] **Step 1: Update the layout to fetch and render header/footer**

Modify `apps/hse-multisite-template/src/app/[lang]/layout.tsx`:

Add imports at the top of the file (after the existing imports):

```typescript
import { warn } from "@repo/logger";
import type { CMSHeaderResponse } from "@repo/wagtail-cms-types/settings";
import type { CMSFooterResponse } from "@repo/wagtail-cms-types/settings";
import type { NotFoundContents } from "@repo/wagtail-cms-types/core";

import { cmsClient } from "@/lib/cms/client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
```

Note: `@repo/logger` is already imported for `error as logError`. Update the import to also include `warn`:

```typescript
import { error as logError, warn } from "@repo/logger";
```

Add the ISR constant and `isNotFound` helper before the `RootLayout` function:

```typescript
/** ISR revalidation interval in seconds (1 hour). */
const REVALIDATE_SECONDS = 3600;

function isNotFound(response: unknown): response is NotFoundContents {
	return (
		response != null &&
		typeof response === "object" &&
		"message" in response &&
		"data" in response
	);
}
```

Update the `RootLayout` function body. Add CMS fetching before the return statement, after the dictionary loading:

```typescript
const [headerResponse, footerResponse] = await Promise.all([
	cmsClient.fetchHeader({ next: { revalidate: REVALIDATE_SECONDS } } as RequestInit),
	cmsClient.fetchFooter({ next: { revalidate: REVALIDATE_SECONDS } } as RequestInit),
]);

let headerData: CMSHeaderResponse | null = null;
if (isNotFound(headerResponse)) {
	warn("[Layout] Failed to fetch header:", headerResponse.message);
} else {
	headerData = headerResponse;
}

let footerData: CMSFooterResponse | null = null;
if (isNotFound(footerResponse)) {
	warn("[Layout] Failed to fetch footer:", footerResponse.message);
} else {
	footerData = footerResponse;
}
```

Update the JSX return to include the header and footer. Replace the existing `<body>` contents:

```tsx
<body>
	<OneTrustScripts />
	<PiwikProScripts>
		<DictionaryProvider flat={flat} locale={lang}>
			<SiteHeader data={headerData} />
			{props.children}
			<SiteFooter data={footerData} />
		</DictionaryProvider>
	</PiwikProScripts>
</body>
```

Note: Do NOT wrap `{props.children}` in `<main>` — the CMS mapping package's `renderPage` already renders `<main className="hse-main-wrapper">` around page content. Adding another `<main>` here would create invalid nested `<main>` tags.

- [ ] **Step 2: Run typecheck**

Run: `turbo run typecheck --filter=hse-multisite-template`
Expected: PASS.

- [ ] **Step 3: Run dev server and verify**

Run: `turbo run dev --filter=hse-multisite-template`

Verify in the browser:
1. Header renders with logo, main nav links, utility links, and mobile links
2. Footer renders with primary links and secondary links
3. Links navigate correctly
4. Temporarily stop the CMS (or use a bad URL) and verify the logo-only header and copyright-only footer fallbacks render

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All existing tests PASS. No regressions.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: No lint errors.

- [ ] **Step 6: Commit**

```bash
git add apps/hse-multisite-template/src/app/[lang]/layout.tsx
git commit -m "feat(app): integrate CMS-driven header and footer into layout"
```
