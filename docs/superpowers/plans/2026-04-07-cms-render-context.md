# CMS Render Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thread a context object (page data, block position, API client) through every block and page component via props from the factory.

**Architecture:** The `createCMSRenderer` factory accepts a required `CMSClient` instance, builds a `CMSRenderContext` per-component (with position metadata for blocks), and passes it as a `context` prop. No React Context — pure props, Server Component compatible.

**Tech Stack:** TypeScript, React, Vitest, @repo/wagtail-api-client (type-only import)

**Spec:** `docs/superpowers/specs/2026-04-07-cms-render-context-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/wagtail-cms-mapping/package.json` | Add `@repo/wagtail-api-client` dependency |
| Modify | `packages/wagtail-cms-mapping/src/types/index.ts` | Add `BlockPosition`, `CMSRenderContext`, update `BlockComponentProps`, `PageLayoutProps`, `CMSRendererOptions` |
| Modify | `packages/wagtail-cms-mapping/src/index.tsx` | Update factory to accept `apiClient`, build context, thread it through |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-text.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-image.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-inset-text.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-quote.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-promo.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-links-list.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-action-link.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-details.tsx` | Add `context`, remove `renderBlocks ?` null check |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-details-group.tsx` | Add `context`, remove `renderBlocks ?` null check |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-button.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-content-block.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-brightcove.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-related-info.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-teaser-links.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/blocks/block-fallback.tsx` | Add `context, renderBlocks` to signature |
| Modify | `packages/wagtail-cms-mapping/src/pages/content-page.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/pages/landing-page.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/pages/curated-hub-page.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/pages/organisation-listing-page.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/pages/organisation-landing-page.tsx` | Add `context` to signature |
| Modify | `packages/wagtail-cms-mapping/src/index.test.tsx` | Update all tests to pass `apiClient`, add context/position tests |
| Modify | `packages/wagtail-cms-mapping/src/blocks/blocks.test.tsx` | Update tests to pass `context` and `renderBlocks` props |
| Modify | `packages/wagtail-cms-mapping/src/types/index.test.ts` | No changes needed (type guards unchanged) |
| Modify | `packages/wagtail-cms-mapping/src/pages/pages.test.tsx` | No changes needed (registry completeness unchanged) |

---

### Task 1: Update types and add dependency

**Files:**
- Modify: `packages/wagtail-cms-mapping/package.json`
- Modify: `packages/wagtail-cms-mapping/src/types/index.ts`

- [ ] **Step 1: Add `@repo/wagtail-api-client` to package.json dependencies**

In `packages/wagtail-cms-mapping/package.json`, add to the `dependencies` object:

```json
"@repo/wagtail-api-client": "workspace:*"
```

The full dependencies block becomes:

```json
"dependencies": {
    "@repo/wagtail-api-client": "workspace:*",
    "@repo/wagtail-cms-types": "workspace:*",
    "@hseireland/hse-frontend-react": "catalog:",
    "html-react-parser": "^5.2.2",
    "next": "catalog:",
    "react": "catalog:",
    "zod": "catalog:"
}
```

- [ ] **Step 2: Run pnpm install**

Run: `pnpm install`
Expected: Lockfile updates, no errors.

- [ ] **Step 3: Replace the full contents of `src/types/index.ts`**

```typescript
import type { CMSClient } from "@repo/wagtail-api-client";
import type {
	CMSBlockComponentsKeys,
	CMSBlockType,
} from "@repo/wagtail-cms-types/blocks";
import type { CMSPageType } from "@repo/wagtail-cms-types/core";
import type {
	CMSContentPageProps,
	CMSCuratedHubPageProps,
	CMSLandingPageProps,
	CMSOrganisationLandingPageProps,
	CMSOrganisationListingPageProps,
	CMSPageProps,
} from "@repo/wagtail-cms-types/page-models";
import type { ComponentType } from "react";

export type BlockPosition = {
	index: number;
	isFirst: boolean;
	isLast: boolean;
	previous: CMSBlockType | null;
	next: CMSBlockType | null;
};

export type CMSRenderContext = {
	page: CMSPageProps;
	apiClient: CMSClient;
	position: BlockPosition;
};

export type BlockComponentProps<TValue = unknown> = {
	id: string;
	type: CMSBlockComponentsKeys;
	value: TValue;
	settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
	context: CMSRenderContext;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type PageLayoutProps = {
	page: CMSPageProps;
	context: Omit<CMSRenderContext, "position">;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

export type BlockRegistry = Partial<
	// biome-ignore lint/suspicious/noExplicitAny: registry stores heterogeneous block components with different value types
	Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps<any>>>
>;

export type PageRegistry = Partial<
	Record<CMSPageType, ComponentType<PageLayoutProps>>
>;

export type CMSRendererOptions = {
	apiClient: CMSClient;
	blocks?: BlockRegistry;
	pages?: PageRegistry;
	fallbackBlock?: ComponentType<BlockComponentProps>;
	fallbackPage?: ComponentType<PageLayoutProps>;
};

export type CMSRenderer = {
	renderBlock: (block: CMSBlockType) => React.ReactNode;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
	renderPage: (page: CMSPageProps) => React.ReactNode;
};

export function isContentPage(page: CMSPageProps): page is CMSContentPageProps {
	return page.meta.type === "hsebase.ContentPage";
}
export function isLandingPage(page: CMSPageProps): page is CMSLandingPageProps {
	return page.meta.type === "hsebase.LandingPage";
}
export function isCuratedHubPage(
	page: CMSPageProps,
): page is CMSCuratedHubPageProps {
	return page.meta.type === "hsebase.CuratedHubPage";
}
export function isOrganisationListingPage(
	page: CMSPageProps,
): page is CMSOrganisationListingPageProps {
	return page.meta.type === "hsebase.OrganisationListingPage";
}
export function isOrganisationLandingPage(
	page: CMSPageProps,
): page is CMSOrganisationLandingPageProps {
	return page.meta.type === "hsebase.OrganisationLandingPage";
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd packages/wagtail-cms-mapping && pnpm typecheck`
Expected: Type errors in `src/index.tsx` (factory doesn't pass context yet) and block/page components (missing context prop). This is expected — we fix those in Tasks 2-4.

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-mapping/package.json packages/wagtail-cms-mapping/src/types/index.ts pnpm-lock.yaml
git commit -m "feat(wagtail-cms-mapping): add CMSRenderContext types and api-client dependency"
```

---

### Task 2: Update factory to thread context

**Files:**
- Modify: `packages/wagtail-cms-mapping/src/index.tsx`

- [ ] **Step 1: Replace the full contents of `src/index.tsx`**

```tsx
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { defaultBlockRegistry } from "./blocks/index";
import { defaultPageRegistry } from "./pages/index";
import type {
	BlockComponentProps,
	CMSRenderer,
	CMSRendererOptions,
	PageLayoutProps,
} from "./types/index";

function DefaultFallbackBlock({ type, value, context }: BlockComponentProps) {
	if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME !== "local") return null;
	return (
		<div>
			<h2>Missing Block Type: {type}</h2>
			<p>Page: {context.page.meta.type}</p>
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}

function DefaultFallbackPage({ page, renderBlocks }: PageLayoutProps) {
	return (
		<main>
			<h1>{page.title}</h1>
			{renderBlocks(page.body)}
		</main>
	);
}

export function createCMSRenderer(options: CMSRendererOptions): CMSRenderer {
	const { apiClient } = options;
	const blockRegistry = {
		...defaultBlockRegistry,
		...options?.blocks,
	};
	const pageRegistry = {
		...defaultPageRegistry,
		...options?.pages,
	};
	const FallbackBlock = options?.fallbackBlock ?? DefaultFallbackBlock;
	const FallbackPage = options?.fallbackPage ?? DefaultFallbackPage;

	let currentPage: CMSPageProps;

	function renderBlock(block: CMSBlockType): React.ReactNode {
		const Component = blockRegistry[block.type] ?? FallbackBlock;
		return (
			<Component
				key={block.id}
				{...block}
				context={{
					page: currentPage,
					apiClient,
					position: {
						index: 0,
						isFirst: true,
						isLast: true,
						previous: null,
						next: null,
					},
				}}
				renderBlocks={renderBlocks}
			/>
		);
	}

	function renderBlocks(blocks: CMSBlockType[] = []): React.ReactNode[] {
		if (!blocks) return [];
		return blocks.map((block, index) => {
			const Component = blockRegistry[block.type] ?? FallbackBlock;
			return (
				<Component
					key={block.id}
					{...block}
					context={{
						page: currentPage,
						apiClient,
						position: {
							index,
							isFirst: index === 0,
							isLast: index === blocks.length - 1,
							previous: blocks[index - 1] ?? null,
							next: blocks[index + 1] ?? null,
						},
					}}
					renderBlocks={renderBlocks}
				/>
			);
		});
	}

	function renderPage(page: CMSPageProps): React.ReactNode {
		currentPage = page;
		const Layout = pageRegistry[page.meta.type] ?? FallbackPage;
		return (
			<Layout
				key={page.id}
				page={page}
				context={{ page, apiClient }}
				renderBlocks={renderBlocks}
			/>
		);
	}

	return { renderBlock, renderBlocks, renderPage };
}

export type * from "./types/index";
```

- [ ] **Step 2: Run typecheck**

Run: `cd packages/wagtail-cms-mapping && pnpm typecheck`
Expected: Errors in block and page components (they don't destructure `context` yet). Factory itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add packages/wagtail-cms-mapping/src/index.tsx
git commit -m "feat(wagtail-cms-mapping): thread context through factory render loop"
```

---

### Task 3: Update all block components

**Files:**
- Modify: All 15 files in `packages/wagtail-cms-mapping/src/blocks/block-*.tsx`

Update every block component signature to destructure `context` and `renderBlocks`. For components that already use `renderBlocks`, remove the `?` null check since it's now required.

- [ ] **Step 1: Update `block-text.tsx`**

Change the function signature from:
```tsx
export function BlockText({ value }: BlockComponentProps<BlockTextValue>) {
```
to:
```tsx
export function BlockText({ value, context, renderBlocks }: BlockComponentProps<BlockTextValue>) {
```

- [ ] **Step 2: Update `block-image.tsx`**

Change the function signature from:
```tsx
export function BlockImage({ value }: BlockComponentProps<FieldTypeImage>) {
```
to:
```tsx
export function BlockImage({ value, context, renderBlocks }: BlockComponentProps<FieldTypeImage>) {
```

- [ ] **Step 3: Update `block-inset-text.tsx`**

Change the function signature from:
```tsx
export function BlockInsetText({ value, }: BlockComponentProps<BlockInsetTextValue>) {
```
to:
```tsx
export function BlockInsetText({ value, context, renderBlocks }: BlockComponentProps<BlockInsetTextValue>) {
```

- [ ] **Step 4: Update `block-quote.tsx`**

Change the function signature from:
```tsx
export function BlockQuote({ value }: BlockComponentProps<BlockQuoteValue>) {
```
to:
```tsx
export function BlockQuote({ value, context, renderBlocks }: BlockComponentProps<BlockQuoteValue>) {
```

- [ ] **Step 5: Update `block-promo.tsx`**

Change the function signature from:
```tsx
export function BlockPromo({ value }: BlockComponentProps<PromoItem[]>) {
```
to:
```tsx
export function BlockPromo({ value, context, renderBlocks }: BlockComponentProps<PromoItem[]>) {
```

- [ ] **Step 6: Update `block-links-list.tsx`**

Change the function signature from:
```tsx
export function BlockLinksList({ value }: BlockComponentProps<LinksListValue>) {
```
to:
```tsx
export function BlockLinksList({ value, context, renderBlocks }: BlockComponentProps<LinksListValue>) {
```

- [ ] **Step 7: Update `block-action-link.tsx`**

Change the function signature from:
```tsx
export function BlockActionLink({ value, }: BlockComponentProps<ActionLinkValue>) {
```
to:
```tsx
export function BlockActionLink({ value, context, renderBlocks }: BlockComponentProps<ActionLinkValue>) {
```

- [ ] **Step 8: Update `block-details.tsx`**

Change the function signature from:
```tsx
export function BlockDetails({ type, value, renderBlocks, }: BlockComponentProps<DetailsValue>) {
```
to:
```tsx
export function BlockDetails({ type, value, context, renderBlocks }: BlockComponentProps<DetailsValue>) {
```

Also change line 16 from:
```tsx
{renderBlocks ? renderBlocks(value.body) : null}
```
to:
```tsx
{renderBlocks(value.body)}
```

- [ ] **Step 9: Update `block-details-group.tsx`**

Change the function signature from:
```tsx
export function BlockDetailsGroup({ value, renderBlocks, }: BlockComponentProps<DetailsGroupValue>) {
```
to:
```tsx
export function BlockDetailsGroup({ value, context, renderBlocks }: BlockComponentProps<DetailsGroupValue>) {
```

Also change the renderBlocks null check from:
```tsx
{renderBlocks ? renderBlocks(item.body) : null}
```
to:
```tsx
{renderBlocks(item.body)}
```

- [ ] **Step 10: Update `block-button.tsx`**

Change the function signature from:
```tsx
export function BlockButton({ value }: BlockComponentProps<ButtonValue>) {
```
to:
```tsx
export function BlockButton({ value, context, renderBlocks }: BlockComponentProps<ButtonValue>) {
```

- [ ] **Step 11: Update `block-content-block.tsx`**

Change the function signature from:
```tsx
export function BlockContentBlock({ value, renderBlocks, }: BlockComponentProps<ContentBlockValue>) {
```
to:
```tsx
export function BlockContentBlock({ value, context, renderBlocks }: BlockComponentProps<ContentBlockValue>) {
```

(No null check change needed — it already calls `renderBlocks(value.body)` directly.)

- [ ] **Step 12: Update `block-brightcove.tsx`**

Change the function signature from:
```tsx
export function BlockBrightcove({ value, }: BlockComponentProps<BrightcoveValue>) {
```
to:
```tsx
export function BlockBrightcove({ value, context, renderBlocks }: BlockComponentProps<BrightcoveValue>) {
```

- [ ] **Step 13: Update `block-related-info.tsx`**

Change the function signature from:
```tsx
export function BlockRelatedInfo({ value, }: BlockComponentProps<RelatedInfoValue>) {
```
to:
```tsx
export function BlockRelatedInfo({ value, context, renderBlocks }: BlockComponentProps<RelatedInfoValue>) {
```

- [ ] **Step 14: Update `block-teaser-links.tsx`**

Change the function signature from:
```tsx
export function BlockTeaserLinks({ value, }: BlockComponentProps<TeaserLinksValue>) {
```
to:
```tsx
export function BlockTeaserLinks({ value, context, renderBlocks }: BlockComponentProps<TeaserLinksValue>) {
```

- [ ] **Step 15: Update `block-fallback.tsx`**

Change the function signature from:
```tsx
export function BlockFallback({ type, value }: BlockComponentProps) {
```
to:
```tsx
export function BlockFallback({ type, value, context, renderBlocks }: BlockComponentProps) {
```

- [ ] **Step 16: Run typecheck**

Run: `cd packages/wagtail-cms-mapping && pnpm typecheck`
Expected: Errors only in page components (they don't have `context` yet). All block components should be clean.

- [ ] **Step 17: Run lint**

Run: `cd packages/wagtail-cms-mapping && pnpm lint`
Expected: Biome may flag unused `context` and `renderBlocks` parameters. This is expected — the parameters are part of the interface contract. Add biome-ignore comments if Biome errors on them, OR simply don't destructure unused params (use `_context` prefix or omit from destructuring). The cleanest approach: only destructure params the component actually uses. For components that don't use `context` or `renderBlocks`, keep the signature accepting the full props type but only destructure what's used.

**Important:** If Biome flags unused destructured params, the fix is to NOT destructure them — the component still accepts them via the typed props. For example:
```tsx
// ✅ This is fine — BlockComponentProps includes context and renderBlocks, we just don't destructure them
export function BlockText({ value }: BlockComponentProps<BlockTextValue>) {
```

If this approach works with TypeScript (the component still satisfies the type), revert the signature changes for components that don't use `context` or `renderBlocks` and only update the 4 components that actually use them: `BlockDetails`, `BlockDetailsGroup`, `BlockContentBlock`, `BlockFallback`.

For all other block components, only the **type** change matters (via `BlockComponentProps` now requiring `context` and `renderBlocks`) — the factory passes them, the component can ignore them.

- [ ] **Step 18: Commit**

```bash
git add packages/wagtail-cms-mapping/src/blocks/
git commit -m "feat(wagtail-cms-mapping): add context to all block component signatures"
```

---

### Task 4: Update all page layout components

**Files:**
- Modify: All 5 files in `packages/wagtail-cms-mapping/src/pages/*.tsx` (not `index.ts`)

- [ ] **Step 1: Update `content-page.tsx`**

Change the function signature from:
```tsx
export function ContentPage({ page, renderBlocks }: PageLayoutProps) {
```
to:
```tsx
export function ContentPage({ page, renderBlocks, context }: PageLayoutProps) {
```

- [ ] **Step 2: Update `landing-page.tsx`**

Change the function signature from:
```tsx
export function LandingPage({ page, renderBlocks }: PageLayoutProps) {
```
to:
```tsx
export function LandingPage({ page, renderBlocks, context }: PageLayoutProps) {
```

- [ ] **Step 3: Update `curated-hub-page.tsx`**

Change the function signature from:
```tsx
export function CuratedHubPage({ page, renderBlocks }: PageLayoutProps) {
```
to:
```tsx
export function CuratedHubPage({ page, renderBlocks, context }: PageLayoutProps) {
```

- [ ] **Step 4: Update `organisation-listing-page.tsx`**

Change the function signature from:
```tsx
export function OrganisationListingPage({ page, renderBlocks, }: PageLayoutProps) {
```
to:
```tsx
export function OrganisationListingPage({ page, renderBlocks, context }: PageLayoutProps) {
```

- [ ] **Step 5: Update `organisation-landing-page.tsx`**

Change the function signature from:
```tsx
export function OrganisationLandingPage({ page, renderBlocks, }: PageLayoutProps) {
```
to:
```tsx
export function OrganisationLandingPage({ page, renderBlocks, context }: PageLayoutProps) {
```

- [ ] **Step 6: Run typecheck**

Run: `cd packages/wagtail-cms-mapping && pnpm typecheck`
Expected: Clean — all types should resolve now.

- [ ] **Step 7: Run lint**

Run: `cd packages/wagtail-cms-mapping && pnpm lint`
Expected: Same consideration as Task 3 — Biome may flag unused `context`. If so, remove `context` from the destructuring (the prop is still accepted via `PageLayoutProps`). Only destructure `context` in page components that actually use it (none do yet).

- [ ] **Step 8: Commit**

```bash
git add packages/wagtail-cms-mapping/src/pages/
git commit -m "feat(wagtail-cms-mapping): add context to all page layout signatures"
```

---

### Task 5: Update tests

**Files:**
- Modify: `packages/wagtail-cms-mapping/src/index.test.tsx`
- Modify: `packages/wagtail-cms-mapping/src/blocks/blocks.test.tsx`

- [ ] **Step 1: Replace the full contents of `src/index.test.tsx`**

```tsx
import type { CMSClient } from "@repo/wagtail-api-client";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCMSRenderer } from "./index";
import type { BlockComponentProps, PageLayoutProps } from "./types/index";

const mockApiClient = {
	fetchContent: vi.fn(),
} as unknown as CMSClient;

function makeBlock(type: string, value: unknown = {}): CMSBlockType {
	return { id: `block-${type}`, type: type as CMSBlockType["type"], value };
}

function makePageMeta(type: string) {
	return {
		slug: "test",
		type,
		locale: "en",
		html_url: "https://example.com/test/",
		detail_url: "https://example.com/api/pages/1/",
		first_published_at: "2024-01-01T00:00:00Z",
		last_published_at: "2024-01-01T00:00:00Z",
		search_description: "",
		parent: null,
	};
}

function makePage(
	type: string,
	extra: Record<string, unknown> = {},
): CMSPageProps {
	return {
		id: 1,
		title: "Test Page",
		meta: makePageMeta(type) as CMSPageProps["meta"],
		header: [],
		body: [],
		...extra,
	} as CMSPageProps;
}

describe("createCMSRenderer", () => {
	it("returns renderBlock, renderBlocks, and renderPage", () => {
		const renderer = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderer.renderBlock).toBeTypeOf("function");
		expect(renderer.renderBlocks).toBeTypeOf("function");
		expect(renderer.renderPage).toBeTypeOf("function");
	});

	it("renderBlocks returns empty array for empty input", () => {
		const { renderBlocks } = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderBlocks([])).toEqual([]);
	});

	it("renderBlocks returns empty array for undefined input", () => {
		const { renderBlocks } = createCMSRenderer({ apiClient: mockApiClient });
		expect(renderBlocks(undefined as unknown as CMSBlockType[])).toEqual([]);
	});

	it("uses override block component when provided", () => {
		const CustomText = ({ value }: BlockComponentProps) => (
			<div data-testid="custom-text">{String(value)}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: CustomText },
		});
		const result = renderPage(
			makePage("hsebase.ContentPage", {
				body: [makeBlock("text", "hello")],
			}),
		);
		render(<>{result}</>);
		expect(screen.getByTestId("custom-text")).toBeInTheDocument();
	});

	it("uses override page component when provided", () => {
		const CustomPage = ({ page }: PageLayoutProps) => (
			<div data-testid="custom-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			pages: { "hsebase.ContentPage": CustomPage },
		});
		const result = renderPage(makePage("hsebase.ContentPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-page")).toHaveTextContent("Test Page");
	});

	it("uses custom fallbackBlock for unknown block types", () => {
		const CustomFallback = ({ type }: BlockComponentProps) => (
			<div data-testid="custom-fallback">{type}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			fallbackBlock: CustomFallback,
		});
		const result = renderPage(
			makePage("hsebase.ContentPage", {
				// biome-ignore lint/suspicious/noExplicitAny: testing unmapped block type
				body: [makeBlock("unknown_type" as any)],
			}),
		);
		render(<>{result}</>);
		expect(screen.getByTestId("custom-fallback")).toHaveTextContent(
			"unknown_type",
		);
	});

	it("uses custom fallbackPage for unknown page types", () => {
		const CustomFallback = ({ page }: PageLayoutProps) => (
			<div data-testid="fallback-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			fallbackPage: CustomFallback,
		});
		const result = renderPage(makePage("hsebase.UnknownPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("fallback-page")).toHaveTextContent("Test Page");
	});
});

describe("context.position", () => {
	it("computes isFirst, isLast, previous, next for block arrays", () => {
		const positions: { index: number; isFirst: boolean; isLast: boolean; prevType: string | null; nextType: string | null }[] = [];
		const Spy = ({ context }: BlockComponentProps) => {
			positions.push({
				index: context.position.index,
				isFirst: context.position.isFirst,
				isLast: context.position.isLast,
				prevType: context.position.previous?.type ?? null,
				nextType: context.position.next?.type ?? null,
			});
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy, quote: Spy, image: Spy },
		});
		renderPage(
			makePage("hsebase.ContentPage", {
				body: [
					makeBlock("text", "a"),
					makeBlock("quote", "b"),
					makeBlock("image", "c"),
				],
			}),
		);
		expect(positions).toHaveLength(3);
		expect(positions[0]).toEqual({ index: 0, isFirst: true, isLast: false, prevType: null, nextType: "quote" });
		expect(positions[1]).toEqual({ index: 1, isFirst: false, isLast: false, prevType: "text", nextType: "image" });
		expect(positions[2]).toEqual({ index: 2, isFirst: false, isLast: true, prevType: "quote", nextType: null });
	});

	it("provides default position for single renderBlock", () => {
		let capturedPosition: BlockComponentProps["context"]["position"] | null = null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedPosition = context.position;
			return null;
		};
		const { renderPage, renderBlock } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		// Must call renderPage first to set currentPage
		renderPage(makePage("hsebase.ContentPage"));
		renderBlock(makeBlock("text", "solo"));
		expect(capturedPosition).toEqual({
			index: 0,
			isFirst: true,
			isLast: true,
			previous: null,
			next: null,
		});
	});
});

describe("context.page", () => {
	it("provides the current page to block components", () => {
		let capturedPageTitle: string | null = null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedPageTitle = context.page.title;
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		renderPage(
			makePage("hsebase.ContentPage", {
				title: "My Page",
				body: [makeBlock("text")],
			}),
		);
		expect(capturedPageTitle).toBe("My Page");
	});
});

describe("context.apiClient", () => {
	it("passes the same apiClient instance to block components", () => {
		let capturedClient: unknown = null;
		const Spy = ({ context }: BlockComponentProps) => {
			capturedClient = context.apiClient;
			return null;
		};
		const { renderPage } = createCMSRenderer({
			apiClient: mockApiClient,
			blocks: { text: Spy },
		});
		renderPage(
			makePage("hsebase.ContentPage", {
				body: [makeBlock("text")],
			}),
		);
		expect(capturedClient).toBe(mockApiClient);
	});
});
```

- [ ] **Step 2: Update `src/blocks/blocks.test.tsx`**

The block component tests need `context` and `renderBlocks` props. Replace the full file:

```tsx
import type { CMSClient } from "@repo/wagtail-api-client";
import { CMSBlockComponentsKeysSchema } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlockBrightcove } from "./block-brightcove";
import { BlockFallback } from "./block-fallback";
import { BlockText } from "./block-text";
import { defaultBlockRegistry } from "./index";
import type { CMSRenderContext } from "../types/index";

const mockContext: CMSRenderContext = {
	page: {
		id: 1,
		title: "Test",
		meta: {
			slug: "test",
			type: "hsebase.ContentPage",
			locale: "en",
			html_url: "https://example.com/test/",
			detail_url: "https://example.com/api/pages/1/",
			first_published_at: "2024-01-01T00:00:00Z",
			last_published_at: "2024-01-01T00:00:00Z",
			search_description: "",
			parent: null,
		},
		header: [],
		body: [],
	} as CMSPageProps,
	apiClient: { fetchContent: vi.fn() } as unknown as CMSClient,
	position: { index: 0, isFirst: true, isLast: true, previous: null, next: null },
};

const mockRenderBlocks = vi.fn(() => []);

describe("defaultBlockRegistry completeness", () => {
	const allBlockKeys = CMSBlockComponentsKeysSchema.options;

	it("has a component mapped for every CMSBlockComponentsKeys value", () => {
		for (const key of allBlockKeys) {
			expect(
				defaultBlockRegistry[key],
				`Missing block registry entry for "${key}"`,
			).toBeDefined();
		}
	});

	it("maps all 18 block types", () => {
		expect(allBlockKeys).toHaveLength(18);
		expect(Object.keys(defaultBlockRegistry)).toHaveLength(18);
	});
});

describe("BlockText value normalization", () => {
	it("handles string value", () => {
		render(<BlockText id="1" type="text" value="<p>Hello</p>" context={mockContext} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("handles object value with body field", () => {
		render(<BlockText id="2" type="text" value={{ body: "<p>World</p>" }} context={mockContext} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("World")).toBeInTheDocument();
	});
});

describe("BlockBrightcove URL construction", () => {
	it("builds correct Brightcove player URL from value fields", () => {
		render(
			<BlockBrightcove
				id="1"
				type="brightcove_video"
				value={{
					video_id: "123",
					account_id: "456",
					player_slug: "default",
					video_title: "My Video",
					display_video_title: true,
					video_description: "A description",
				}}
				context={mockContext}
				renderBlocks={mockRenderBlocks}
			/>,
		);
		expect(screen.getByTitle("brightcove-player")).toHaveAttribute(
			"src",
			"https://players.brightcove.net/456/default_default/index.html?videoId=123",
		);
	});
});

describe("BlockFallback", () => {
	it("renders nothing when not in local environment", () => {
		const { container } = render(
			// biome-ignore lint/suspicious/noExplicitAny: testing unmapped block type
			<BlockFallback id="1" type={"unknown" as any} value={{ foo: "bar" }} context={mockContext} renderBlocks={mockRenderBlocks} />,
		);
		expect(container.innerHTML).toBe("");
	});
});
```

- [ ] **Step 3: Run tests**

Run: `cd packages/wagtail-cms-mapping && pnpm test`
Expected: All tests pass. The new context/position tests verify the factory threading.

- [ ] **Step 4: Run lint**

Run: `cd packages/wagtail-cms-mapping && pnpm lint`
Expected: Clean (Biome may auto-format).

- [ ] **Step 5: Run full monorepo verification**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: All packages pass. The mapping package types resolve across the monorepo.

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-mapping/src/index.test.tsx packages/wagtail-cms-mapping/src/blocks/blocks.test.tsx
git commit -m "test(wagtail-cms-mapping): update tests for CMSRenderContext and block position"
```

---

### Task 6: Final verification and lint cleanup

**Files:**
- Potentially any file touched in Tasks 1-5 (lint fixes)

- [ ] **Step 1: Run full monorepo checks**

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Expected: All pass. If Biome flagged unused destructured params in Tasks 3-4, verify those were handled (either by not destructuring them, or by adding biome-ignore comments).

- [ ] **Step 2: Verify test count**

Run: `cd packages/wagtail-cms-mapping && pnpm test`
Expected: Tests should include:
- 7 original factory tests (updated with `apiClient`)
- 3 new context tests (position, page, apiClient)
- 4 block component tests (unchanged logic, updated props)
- 2 registry completeness tests (blocks)
- 2 registry completeness tests (pages)
- 10 type guard tests
- 3 generateRichText tests
- Total: ~31 tests

- [ ] **Step 3: Commit any lint fixes**

```bash
git add -u packages/wagtail-cms-mapping/
git commit -m "chore(wagtail-cms-mapping): lint cleanup after context threading"
```

(Skip this step if there are no changes to commit.)
