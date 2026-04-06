# wagtail-cms-mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `@repo/wagtail-cms-mapping` package that bridges CMS data to React components via a hybrid factory pattern, and update `@repo/wagtail-cms-types` to align with the reference backend.

**Architecture:** Factory function (`createCMSRenderer`) merges default block/page registries with optional app-level overrides. Default components use `@hseireland/hse-frontend-react`. Source-only package (no build step), following the same pattern as `@repo/wagtail-cms-types`.

**Tech Stack:** React 19, Next.js 16, Zod, `@hseireland/hse-frontend-react`, `html-react-parser`, Vitest, Testing Library

---

## File Map

### New: `packages/wagtail-cms-mapping/`

| File | Responsibility |
|---|---|
| `package.json` | Package config with sub-path exports |
| `tsconfig.json` | Extends `@repo/typescript-config/react-library.json` |
| `vitest.config.mts` | Vitest config using `createVitestConfig()` |
| `README.md` | Usage docs |
| `src/types/index.ts` | Registry types, component props, renderer options, type guards |
| `src/index.ts` | `createCMSRenderer` factory + re-exports |
| `src/blocks/index.ts` | `defaultBlockRegistry` + barrel exports |
| `src/blocks/block-text.tsx` | Rich text block (text, rich_text_block, richtext) |
| `src/blocks/block-image.tsx` | Responsive image block |
| `src/blocks/block-inset-text.tsx` | Inset/callout text block |
| `src/blocks/block-quote.tsx` | Block quote with attribution |
| `src/blocks/block-promo.tsx` | Promo cards (top_tasks, top_task) |
| `src/blocks/block-links-list.tsx` | Grouped link lists |
| `src/blocks/block-action-link.tsx` | CTA action link |
| `src/blocks/block-details.tsx` | Collapsible details/expander |
| `src/blocks/block-details-group.tsx` | Grouped expanders |
| `src/blocks/block-button.tsx` | Button block |
| `src/blocks/block-content-block.tsx` | Recursive snippet renderer |
| `src/blocks/block-brightcove.tsx` | Brightcove video embed |
| `src/blocks/block-related-info.tsx` | Related information links |
| `src/blocks/block-teaser-links.tsx` | Teaser promo links |
| `src/blocks/block-fallback.tsx` | Dev-only fallback for unmapped types |
| `src/pages/index.ts` | `defaultPageRegistry` + barrel exports |
| `src/pages/content-page.tsx` | ContentPage layout |
| `src/pages/landing-page.tsx` | LandingPage layout |
| `src/pages/curated-hub-page.tsx` | CuratedHubPage layout |
| `src/pages/organisation-listing-page.tsx` | OrganisationListingPage layout |
| `src/pages/organisation-landing-page.tsx` | OrganisationLandingPage layout |
| `src/utils/generate-rich-text.tsx` | HTML-to-React parser for rich text |
| `src/components/page-title.tsx` | Shared PageTitle component |
| `src/components/breadcrumb.tsx` | Shared Breadcrumb wrapper |

### Modified: `packages/wagtail-cms-types/`

| File | Change |
|---|---|
| `src/types/blocks/base.ts` | Replace `CMSBlockComponentsKeysSchema` enum (22 → 18 keys) |
| `src/types/core/index.ts` | Replace `CMSPageTypeSchema` enum (6 → 5 keys with `hsebase` prefix) |
| `src/types/page-models/appbase.ts` | Delete |
| `src/types/page-models/news.ts` | Delete |
| `src/types/page-models/hsebase.ts` | Create — 5 page model schemas |
| `src/types/page-models/index.ts` | Update re-exports and `CMSPageProps` union |
| `src/types/blocks/index.ts` | Update `BlockValuesProps` union |
| `src/types/blocks/content-block.ts` | Rename type from `content_block` to `content_block_chooser` |

### Modified: Documentation & agentic dev files

| File | Change |
|---|---|
| `CLAUDE.md` | Add `@repo/wagtail-cms-mapping` to workspace table + build conventions |
| `.github/copilot-instructions.md` | Add package to table |
| `.github/instructions/cms-packages.instructions.md` | Add mapping package section, update enums |
| `.github/agents/cms-specialist.agent.md` | Update block/page type enums |
| `.github/agents/react-expert.agent.md` | Update block rendering example to factory pattern |
| `.github/prompts/new-streamfield-block.prompt.md` | Add mapping registry step |
| `.github/prompts/new-page-model.prompt.md` | Add mapping registry step |
| `.github/prompts/new-page-with-blocks.prompt.md` | Update workflow to factory pattern |
| `.github/prompts/integrate-component.prompt.md` | Point at mapping package |
| `.github/skills/cms-content-fetching/SKILL.md` | Update data flow, enums, rendering examples |

---

## Task 1: Update `@repo/wagtail-cms-types` block enum

**Files:**
- Modify: `packages/wagtail-cms-types/src/types/blocks/base.ts:21-44`
- Modify: `packages/wagtail-cms-types/src/types/blocks/content-block.ts:21-22`
- Modify: `packages/wagtail-cms-types/src/types/blocks/index.ts:20-22`

- [ ] **Step 1: Write test for updated block keys**

Create `packages/wagtail-cms-types/src/types/blocks/base.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { CMSBlockComponentsKeysSchema } from "./base";

describe("CMSBlockComponentsKeysSchema", () => {
	it("accepts all valid block types", () => {
		const validKeys = [
			"text",
			"rich_text_block",
			"richtext",
			"image",
			"inset_text",
			"quote",
			"top_tasks",
			"top_task",
			"links_list_group_v2",
			"action_link",
			"expander",
			"expander_group",
			"details",
			"button_list",
			"content_block_chooser",
			"brightcove_video",
			"related_information",
			"teaser_links",
		];
		for (const key of validKeys) {
			expect(CMSBlockComponentsKeysSchema.safeParse(key).success).toBe(true);
		}
	});

	it("rejects removed block types", () => {
		const removedKeys = [
			"content_block",
			"alert",
			"page_header",
			"text_picture",
			"picture",
			"group",
			"title_and_text",
			"row",
			"accordion",
			"cta",
			"cta_panel",
			"card",
			"text_and_icon",
			"cover",
			"section_listing",
			"hero_image_banner",
			"youtube",
			"team_member",
			"timeline",
			"demo_ui_banner",
		];
		for (const key of removedKeys) {
			expect(CMSBlockComponentsKeysSchema.safeParse(key).success).toBe(false);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-types && pnpm vitest run src/types/blocks/base.test.ts`
Expected: FAIL — old keys still present, new keys missing

- [ ] **Step 3: Update the block keys enum**

Replace the `CMSBlockComponentsKeysSchema` in `packages/wagtail-cms-types/src/types/blocks/base.ts:21-44`:

```typescript
export const CMSBlockComponentsKeysSchema = z.enum([
	"text",
	"rich_text_block",
	"richtext",
	"image",
	"inset_text",
	"quote",
	"top_tasks",
	"top_task",
	"links_list_group_v2",
	"action_link",
	"expander",
	"expander_group",
	"details",
	"button_list",
	"content_block_chooser",
	"brightcove_video",
	"related_information",
	"teaser_links",
]);
```

- [ ] **Step 4: Update content-block.ts to use `content_block_chooser`**

In `packages/wagtail-cms-types/src/types/blocks/content-block.ts`, change the type literal on line 21:

```typescript
export const BlockContentBlockPropsSchema = BaseCMSBlockTypeSchema.extend({
	type: z.literal("content_block_chooser"),
	value: BlockContentBlockValuesPropsSchema,
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/wagtail-cms-types && pnpm vitest run src/types/blocks/base.test.ts`
Expected: PASS

- [ ] **Step 6: Run full package typecheck**

Run: `cd packages/wagtail-cms-types && pnpm typecheck`
Expected: PASS (no type errors)

- [ ] **Step 7: Commit**

```bash
git add packages/wagtail-cms-types/src/types/blocks/
git commit -m "refactor(wagtail-cms-types): align block types with reference backend

Replace 22 placeholder block keys with 18 keys matching the hsebase
Wagtail backend. Rename content_block to content_block_chooser."
```

---

## Task 2: Update `@repo/wagtail-cms-types` page types and models

**Files:**
- Modify: `packages/wagtail-cms-types/src/types/core/index.ts:6-13`
- Delete: `packages/wagtail-cms-types/src/types/page-models/appbase.ts`
- Delete: `packages/wagtail-cms-types/src/types/page-models/news.ts`
- Create: `packages/wagtail-cms-types/src/types/page-models/hsebase.ts`
- Modify: `packages/wagtail-cms-types/src/types/page-models/index.ts`

- [ ] **Step 1: Write test for updated page types**

Create `packages/wagtail-cms-types/src/types/page-models/hsebase.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { CMSPageTypeSchema } from "../core";
import {
	CMSContentPagePropsSchema,
	CMSLandingPagePropsSchema,
	CMSCuratedHubPagePropsSchema,
	CMSOrganisationListingPagePropsSchema,
	CMSOrganisationLandingPagePropsSchema,
} from "./hsebase";

describe("CMSPageTypeSchema", () => {
	it("accepts hsebase page types", () => {
		const validTypes = [
			"hsebase.ContentPage",
			"hsebase.LandingPage",
			"hsebase.CuratedHubPage",
			"hsebase.OrganisationListingPage",
			"hsebase.OrganisationLandingPage",
		];
		for (const type of validTypes) {
			expect(CMSPageTypeSchema.safeParse(type).success).toBe(true);
		}
	});

	it("rejects removed page types", () => {
		const removed = [
			"appbase.HomePage",
			"appbase.LandingPage",
			"appbase.ContentPage",
			"appbase.SearchPage",
			"news.NewsListingPage",
			"news.NewsContentPage",
		];
		for (const type of removed) {
			expect(CMSPageTypeSchema.safeParse(type).success).toBe(false);
		}
	});
});

describe("CMSContentPagePropsSchema", () => {
	const basePage = {
		id: 1,
		title: "Test Page",
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
	};

	it("validates a content page with side_nav", () => {
		const page = {
			...basePage,
			side_nav: [{ title: "Related", url: "/related/" }],
		};
		expect(CMSContentPagePropsSchema.safeParse(page).success).toBe(true);
	});

	it("validates a content page without optional fields", () => {
		expect(CMSContentPagePropsSchema.safeParse(basePage).success).toBe(true);
	});
});

describe("CMSLandingPagePropsSchema", () => {
	const basePage = {
		id: 2,
		title: "Landing",
		meta: {
			slug: "landing",
			type: "hsebase.LandingPage",
			locale: "en",
			html_url: "https://example.com/landing/",
			detail_url: "https://example.com/api/pages/2/",
			first_published_at: "2024-01-01T00:00:00Z",
			last_published_at: "2024-01-01T00:00:00Z",
			search_description: "",
			parent: null,
		},
		header: [],
		body: [],
	};

	it("validates a landing page with content zones", () => {
		const page = { ...basePage, top_content: [], bottom_content: [] };
		expect(CMSLandingPagePropsSchema.safeParse(page).success).toBe(true);
	});
});

describe("CMSOrganisationListingPagePropsSchema", () => {
	it("requires organisation_links and count", () => {
		const page = {
			id: 3,
			title: "Orgs",
			meta: {
				slug: "orgs",
				type: "hsebase.OrganisationListingPage",
				locale: "en",
				html_url: "https://example.com/orgs/",
				detail_url: "https://example.com/api/pages/3/",
				first_published_at: "2024-01-01T00:00:00Z",
				last_published_at: "2024-01-01T00:00:00Z",
				search_description: "",
				parent: null,
			},
			header: [],
			body: [],
			organisation_links: [],
			organisation_links_count: 0,
		};
		expect(
			CMSOrganisationListingPagePropsSchema.safeParse(page).success,
		).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-types && pnpm vitest run src/types/page-models/hsebase.test.ts`
Expected: FAIL — files don't exist yet

- [ ] **Step 3: Update CMSPageTypeSchema**

In `packages/wagtail-cms-types/src/types/core/index.ts:6-13`, replace the enum:

```typescript
export const CMSPageTypeSchema = z.enum([
	"hsebase.ContentPage",
	"hsebase.LandingPage",
	"hsebase.CuratedHubPage",
	"hsebase.OrganisationListingPage",
	"hsebase.OrganisationLandingPage",
]);
```

- [ ] **Step 4: Create hsebase.ts page model schemas**

Create `packages/wagtail-cms-types/src/types/page-models/hsebase.ts`:

```typescript
import { z } from "zod";
import { NavItemSchema } from "../fields";
import { BaseCMSBlockTypeSchema } from "../blocks";
import { type CMSPageWithBlocks, CMSPageWithBlocksSchema } from "./index";

/**
 * Content page model schema — standard page with optional side navigation.
 */
export const CMSContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	side_nav: z.array(NavItemSchema).optional(),
});

export type CMSContentPageProps = z.infer<typeof CMSContentPagePropsSchema>;

/**
 * Landing page model schema — supports top, main, and bottom content zones.
 */
export const CMSLandingPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	top_content: z.array(BaseCMSBlockTypeSchema).optional(),
	bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
});

export type CMSLandingPageProps = z.infer<typeof CMSLandingPagePropsSchema>;

/**
 * Curated hub page model schema — main content with optional bottom zone.
 */
export const CMSCuratedHubPagePropsSchema = CMSPageWithBlocksSchema.extend({
	lead_text: z.string().optional(),
	bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
});

export type CMSCuratedHubPageProps = z.infer<
	typeof CMSCuratedHubPagePropsSchema
>;

/**
 * Organisation landing page model schema — full-width with bottom content.
 */
export const CMSOrganisationLandingPagePropsSchema =
	CMSPageWithBlocksSchema.extend({
		lead_text: z.string().optional(),
		bottom_content: z.array(BaseCMSBlockTypeSchema).optional(),
	});

export type CMSOrganisationLandingPageProps = z.infer<
	typeof CMSOrganisationLandingPagePropsSchema
>;

/**
 * Organisation listing page model schema — lists organisation links.
 */
export const CMSOrganisationListingPagePropsSchema =
	CMSPageWithBlocksSchema.extend({
		lead_text: z.string().optional(),
		organisation_links: z.array(BaseCMSBlockTypeSchema),
		organisation_links_count: z.number(),
	});

export type CMSOrganisationListingPageProps = z.infer<
	typeof CMSOrganisationListingPagePropsSchema
>;
```

- [ ] **Step 5: Delete old page model files**

Delete `packages/wagtail-cms-types/src/types/page-models/appbase.ts` and `packages/wagtail-cms-types/src/types/page-models/news.ts`.

- [ ] **Step 6: Update page-models/index.ts**

Replace `packages/wagtail-cms-types/src/types/page-models/index.ts`:

```typescript
import { z } from "zod";
import { BaseCMSBlockTypeSchema } from "../blocks";
import { CMSPageContentSchema } from "../core";

// Re-export all page types
export * from "./hsebase";

/**
 * Base interface for pages that support block-based content structure.
 */
export const CMSPageWithBlocksSchema = CMSPageContentSchema.extend({
	header: z.array(BaseCMSBlockTypeSchema),
	body: z.array(BaseCMSBlockTypeSchema),
});

export type CMSPageWithBlocks = z.infer<typeof CMSPageWithBlocksSchema>;

/**
 * Union type of all page model props interfaces.
 */
export type CMSPageProps =
	| import("./hsebase").CMSContentPageProps
	| import("./hsebase").CMSLandingPageProps
	| import("./hsebase").CMSCuratedHubPageProps
	| import("./hsebase").CMSOrganisationListingPageProps
	| import("./hsebase").CMSOrganisationLandingPageProps;
```

- [ ] **Step 7: Run tests**

Run: `cd packages/wagtail-cms-types && pnpm vitest run`
Expected: PASS (all tests including new ones)

- [ ] **Step 8: Run typecheck**

Run: `cd packages/wagtail-cms-types && pnpm typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/wagtail-cms-types/src/types/core/index.ts packages/wagtail-cms-types/src/types/page-models/
git commit -m "refactor(wagtail-cms-types): align page models with hsebase backend

Replace appbase/news page types with 5 hsebase page models matching the
reference backend: ContentPage, LandingPage, CuratedHubPage,
OrganisationListingPage, OrganisationLandingPage."
```

---

## Task 3: Scaffold `@repo/wagtail-cms-mapping` package

**Files:**
- Create: `packages/wagtail-cms-mapping/package.json`
- Create: `packages/wagtail-cms-mapping/tsconfig.json`
- Create: `packages/wagtail-cms-mapping/vitest.config.mts`

- [ ] **Step 1: Create package.json**

Create `packages/wagtail-cms-mapping/package.json`:

```json
{
	"name": "@repo/wagtail-cms-mapping",
	"version": "0.0.0",
	"private": true,
	"description": "Maps Wagtail CMS data to React components via a factory pattern with overridable defaults",
	"exports": {
		".": "./src/index.ts",
		"./blocks": "./src/blocks/index.ts",
		"./pages": "./src/pages/index.ts",
		"./types": "./src/types/index.ts"
	},
	"scripts": {
		"build": "echo 'Source-only package — no build step'",
		"lint": "biome check --write",
		"typecheck": "tsc --noEmit",
		"test": "vitest run",
		"test:ci": "vitest run --coverage",
		"clean": "rm -rf node_modules"
	},
	"dependencies": {
		"@repo/wagtail-cms-types": "workspace:*",
		"@hseireland/hse-frontend-react": "catalog:",
		"html-react-parser": "^5.2.2",
		"next": "catalog:",
		"react": "catalog:",
		"zod": "catalog:"
	},
	"devDependencies": {
		"@repo/biome-config": "workspace:*",
		"@repo/typescript-config": "workspace:*",
		"@repo/vitest-config": "workspace:*",
		"@testing-library/jest-dom": "catalog:",
		"@testing-library/react": "^16.2.0",
		"@types/node": "catalog:",
		"@types/react": "catalog:",
		"@vitest/coverage-v8": "catalog:",
		"react-dom": "catalog:",
		"typescript": "catalog:",
		"vitest": "catalog:",
		"vitest-sonar-reporter": "catalog:"
	}
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `packages/wagtail-cms-mapping/tsconfig.json`:

```json
{
	"extends": "@repo/typescript-config/react-library.json",
	"compilerOptions": {
		"lib": ["dom", "ES2015"],
		"sourceMap": true,
		"types": ["vitest/globals", "node"]
	},
	"include": ["."],
	"exclude": ["dist", "build", "node_modules"]
}
```

- [ ] **Step 3: Create vitest.config.mts**

Create `packages/wagtail-cms-mapping/vitest.config.mts`:

```typescript
import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
	include: ["src/**/*.{js,jsx,ts,tsx}"],
	exclude: ["src/index.ts"],
});
```

- [ ] **Step 4: Install dependencies**

Run: `cd /Users/danstuart/Sites/work/hse/hse-recovery-platform-frontend && pnpm install`
Expected: lockfile updated, dependencies installed

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-mapping/
git commit -m "feat(wagtail-cms-mapping): scaffold package with config

Source-only package with sub-path exports for blocks, pages, and types.
Uses shared vitest, typescript, and biome configs."
```

---

## Task 4: Types and factory

**Files:**
- Create: `packages/wagtail-cms-mapping/src/types/index.ts`
- Create: `packages/wagtail-cms-mapping/src/index.ts`

- [ ] **Step 1: Write factory test**

Create `packages/wagtail-cms-mapping/src/index.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createCMSRenderer } from "./index";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

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

function makePage(type: string, extra: Record<string, unknown> = {}): CMSPageProps {
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
		const renderer = createCMSRenderer();
		expect(renderer.renderBlock).toBeTypeOf("function");
		expect(renderer.renderBlocks).toBeTypeOf("function");
		expect(renderer.renderPage).toBeTypeOf("function");
	});

	it("renderBlocks returns empty array for empty input", () => {
		const { renderBlocks } = createCMSRenderer();
		expect(renderBlocks([])).toEqual([]);
	});

	it("renderBlocks returns empty array for undefined input", () => {
		const { renderBlocks } = createCMSRenderer();
		expect(renderBlocks(undefined as unknown as CMSBlockType[])).toEqual([]);
	});

	it("uses override block component when provided", () => {
		const CustomText = ({ value }: { value: unknown }) => (
			<div data-testid="custom-text">{String(value)}</div>
		);
		const { renderBlock } = createCMSRenderer({
			blocks: { text: CustomText as any },
		});
		const result = renderBlock(makeBlock("text", "hello"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-text")).toBeInTheDocument();
	});

	it("uses override page component when provided", () => {
		const CustomPage = ({ page }: { page: CMSPageProps }) => (
			<div data-testid="custom-page">{page.title}</div>
		);
		const { renderPage } = createCMSRenderer({
			pages: { "hsebase.ContentPage": CustomPage as any },
		});
		const result = renderPage(makePage("hsebase.ContentPage"));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-page")).toHaveTextContent("Test Page");
	});

	it("uses custom fallbackBlock for unknown block types", () => {
		const CustomFallback = ({ type }: { type: string }) => (
			<div data-testid="custom-fallback">{type}</div>
		);
		const { renderBlock } = createCMSRenderer({
			fallbackBlock: CustomFallback as any,
		});
		const result = renderBlock(makeBlock("unknown_type" as any));
		render(<>{result}</>);
		expect(screen.getByTestId("custom-fallback")).toHaveTextContent("unknown_type");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/index.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create types**

Create `packages/wagtail-cms-mapping/src/types/index.ts`:

```typescript
import type { ComponentType } from "react";
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

/**
 * Props received by every block component.
 */
export type BlockComponentProps<TValue = unknown> = {
	id: string;
	type: CMSBlockComponentsKeys;
	value: TValue;
	settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean };
	renderBlocks?: (blocks: CMSBlockType[]) => React.ReactNode[];
};

/**
 * Props received by every page layout component.
 */
export type PageLayoutProps = {
	page: CMSPageProps;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
};

/** Map of block type keys to their rendering components. */
export type BlockRegistry = Partial<
	Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps<any>>>
>;

/** Map of page type keys to their layout components. */
export type PageRegistry = Partial<
	Record<CMSPageType, ComponentType<PageLayoutProps>>
>;

/** Options for createCMSRenderer. */
export type CMSRendererOptions = {
	blocks?: BlockRegistry;
	pages?: PageRegistry;
	fallbackBlock?: ComponentType<BlockComponentProps>;
	fallbackPage?: ComponentType<PageLayoutProps>;
};

/** Return type of createCMSRenderer. */
export type CMSRenderer = {
	renderBlock: (block: CMSBlockType) => React.ReactNode;
	renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[];
	renderPage: (page: CMSPageProps) => React.ReactNode;
};

// ── Type guards ──────────────────────────────────────────────────────

export function isContentPage(
	page: CMSPageProps,
): page is CMSContentPageProps {
	return page.meta.type === "hsebase.ContentPage";
}

export function isLandingPage(
	page: CMSPageProps,
): page is CMSLandingPageProps {
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

- [ ] **Step 4: Create the factory**

Create `packages/wagtail-cms-mapping/src/index.ts`:

```tsx
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";
import { defaultBlockRegistry } from "./blocks/index";
import { BlockFallback } from "./blocks/block-fallback";
import { defaultPageRegistry } from "./pages/index";
import { ContentPage } from "./pages/content-page";
import type { CMSRenderer, CMSRendererOptions } from "./types/index";

export function createCMSRenderer(options?: CMSRendererOptions): CMSRenderer {
	const blockRegistry = {
		...defaultBlockRegistry,
		...options?.blocks,
	};

	const pageRegistry = {
		...defaultPageRegistry,
		...options?.pages,
	};

	const FallbackBlock = options?.fallbackBlock ?? BlockFallback;
	const FallbackPage = options?.fallbackPage ?? ContentPage;

	function renderBlock(block: CMSBlockType): React.ReactNode {
		const Component = blockRegistry[block.type];
		if (!Component) {
			return <FallbackBlock key={block.id} {...block} />;
		}
		return <Component key={block.id} {...block} renderBlocks={renderBlocks} />;
	}

	function renderBlocks(blocks: CMSBlockType[] = []): React.ReactNode[] {
		if (!blocks) return [];
		return blocks.map(renderBlock);
	}

	function renderPage(page: CMSPageProps): React.ReactNode {
		const Layout = pageRegistry[page.meta.type];
		if (!Layout) {
			return (
				<FallbackPage key={page.id} page={page} renderBlocks={renderBlocks} />
			);
		}
		return <Layout key={page.id} page={page} renderBlocks={renderBlocks} />;
	}

	return { renderBlock, renderBlocks, renderPage };
}

export type * from "./types/index";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/index.test.tsx`
Expected: PASS (the test uses overrides so default components aren't needed yet)

- [ ] **Step 6: Commit**

```bash
git add packages/wagtail-cms-mapping/src/types/ packages/wagtail-cms-mapping/src/index.ts packages/wagtail-cms-mapping/src/index.test.tsx
git commit -m "feat(wagtail-cms-mapping): add types, type guards, and createCMSRenderer factory"
```

---

## Task 5: Utility functions and shared components

**Files:**
- Create: `packages/wagtail-cms-mapping/src/utils/generate-rich-text.tsx`
- Create: `packages/wagtail-cms-mapping/src/components/page-title.tsx`
- Create: `packages/wagtail-cms-mapping/src/components/breadcrumb.tsx`

- [ ] **Step 1: Write test for generateRichText**

Create `packages/wagtail-cms-mapping/src/utils/generate-rich-text.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { generateRichText } from "./generate-rich-text";

describe("generateRichText", () => {
	it("renders plain HTML string", () => {
		const result = generateRichText("<p>Hello world</p>");
		render(<>{result}</>);
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});

	it("renders nested HTML elements", () => {
		const result = generateRichText("<ul><li>Item one</li></ul>");
		render(<>{result}</>);
		expect(screen.getByText("Item one")).toBeInTheDocument();
	});

	it("returns empty fragment for empty string", () => {
		const result = generateRichText("");
		const { container } = render(<>{result}</>);
		expect(container.textContent).toBe("");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/utils/generate-rich-text.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create generateRichText**

Create `packages/wagtail-cms-mapping/src/utils/generate-rich-text.tsx`:

```tsx
import Link from "next/link";
import parse, {
	type DOMNode,
	Element,
	type HTMLReactParserOptions,
	domToReact,
} from "html-react-parser";

const options: HTMLReactParserOptions = {
	replace: (domNode: DOMNode) => {
		if (domNode instanceof Element && domNode.name === "a" && domNode.attribs.href) {
			const { href } = domNode.attribs;

			if (href.startsWith("http")) {
				const url = new URL(href);

				if (url.hostname.includes("publications.hse.ie")) {
					let path = url.pathname;
					if (path.startsWith("/publications")) {
						path = path.replace("/publications", "");
					}
					return (
						<Link href={path}>
							{domToReact(domNode.children as DOMNode[], options)}
						</Link>
					);
				}

				return (
					<Link href={href}>
						{domToReact(domNode.children as DOMNode[], options)}
					</Link>
				);
			}
		}
	},
};

export function generateRichText(html: string) {
	return parse(html, options);
}
```

- [ ] **Step 4: Create PageTitle component**

Create `packages/wagtail-cms-mapping/src/components/page-title.tsx`:

```tsx
import { generateRichText } from "../utils/generate-rich-text";

export type PageTitleProps = {
	title: string;
	lead?: string;
	richLead?: string;
};

export function PageTitle({ title, lead, richLead }: PageTitleProps) {
	return (
		<>
			<h1 className="hse-u-margin-bottom-6">{title}</h1>
			{lead && (
				<div className="hse-lede-text">
					<p>{generateRichText(lead)}</p>
				</div>
			)}
			{richLead && (
				<div className="hse-lede-text">{generateRichText(richLead)}</div>
			)}
		</>
	);
}
```

- [ ] **Step 5: Create Breadcrumb wrapper**

Create `packages/wagtail-cms-mapping/src/components/breadcrumb.tsx`:

```tsx
import Link from "next/link";
import { Breadcrumb as DSBreadcrumb } from "@hseireland/hse-frontend-react";
import type { CMSPageBreadcrumb } from "@repo/wagtail-cms-types/core";

export type BreadcrumbProps = {
	items?: CMSPageBreadcrumb[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
	if (!items || items.length === 0) return null;

	const lastItem = items[items.length - 1];

	return (
		<DSBreadcrumb>
			{items.map((item) => (
				<DSBreadcrumb.Item key={item.id} href={item.url} asElement={Link}>
					{item.title}
				</DSBreadcrumb.Item>
			))}
			{lastItem && (
				<DSBreadcrumb.Back href={lastItem.url} asElement={Link}>
					{lastItem.title}
				</DSBreadcrumb.Back>
			)}
		</DSBreadcrumb>
	);
}
```

- [ ] **Step 6: Run tests**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/utils/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/wagtail-cms-mapping/src/utils/ packages/wagtail-cms-mapping/src/components/
git commit -m "feat(wagtail-cms-mapping): add generateRichText, PageTitle, and Breadcrumb utilities"
```

---

## Task 6: Default block components

**Files:**
- Create: all 15 files in `packages/wagtail-cms-mapping/src/blocks/`

- [ ] **Step 1: Write tests for block components**

Create `packages/wagtail-cms-mapping/src/blocks/blocks.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockText } from "./block-text";
import { BlockQuote } from "./block-quote";
import { BlockInsetText } from "./block-inset-text";
import { BlockFallback } from "./block-fallback";
import { BlockBrightcove } from "./block-brightcove";
import { BlockRelatedInfo } from "./block-related-info";

describe("BlockText", () => {
	it("renders string value as rich text", () => {
		render(<BlockText id="1" type="text" value="<p>Hello</p>" />);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("renders object value with body field", () => {
		render(<BlockText id="2" type="text" value={{ body: "<p>World</p>" }} />);
		expect(screen.getByText("World")).toBeInTheDocument();
	});
});

describe("BlockQuote", () => {
	it("renders title, body, and author", () => {
		render(
			<BlockQuote
				id="1"
				type="quote"
				value={{ title: "Quote Title", body: "Quote body", author: "Author" }}
			/>,
		);
		expect(screen.getByText("Quote Title")).toBeInTheDocument();
		expect(screen.getByText("Quote body")).toBeInTheDocument();
		expect(screen.getByText("Author")).toBeInTheDocument();
	});

	it("renders without optional fields", () => {
		render(
			<BlockQuote id="2" type="quote" value={{ title: "", body: "Only body", author: "" }} />,
		);
		expect(screen.getByText("Only body")).toBeInTheDocument();
	});
});

describe("BlockInsetText", () => {
	it("renders inset text body", () => {
		render(
			<BlockInsetText id="1" type="inset_text" value={{ body: "<p>Important</p>" }} />,
		);
		expect(screen.getByText("Important")).toBeInTheDocument();
	});
});

describe("BlockBrightcove", () => {
	it("renders iframe with correct src", () => {
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
			/>,
		);
		expect(screen.getByTitle("brightcove-player")).toHaveAttribute(
			"src",
			"https://players.brightcove.net/456/default_default/index.html?videoId=123",
		);
		expect(screen.getByText("My Video")).toBeInTheDocument();
	});
});

describe("BlockRelatedInfo", () => {
	it("renders title and links", () => {
		render(
			<BlockRelatedInfo
				id="1"
				type="related_information"
				value={{
					title: "Related",
					links: [
						{ text: "Link 1", external_url: "/link1", new_window: false, internal_page: null },
					],
				}}
			/>,
		);
		expect(screen.getByText("Related")).toBeInTheDocument();
		expect(screen.getByText("Link 1")).toBeInTheDocument();
	});
});

describe("BlockFallback", () => {
	it("renders nothing when not in local environment", () => {
		const { container } = render(
			<BlockFallback id="1" type={"unknown" as any} value={{ foo: "bar" }} />,
		);
		expect(container.innerHTML).toBe("");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/blocks/blocks.test.tsx`
Expected: FAIL — modules not found

- [ ] **Step 3: Create block-fallback.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-fallback.tsx`:

```tsx
import type { BlockComponentProps } from "../types/index";

export function BlockFallback({ type, value }: BlockComponentProps) {
	if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME !== "local") {
		return null;
	}
	return (
		<div>
			<h2>Missing Block Type: {type}</h2>
			<pre>{JSON.stringify(value, null, 2)}</pre>
		</div>
	);
}
```

- [ ] **Step 4: Create block-text.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-text.tsx`:

```tsx
import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

type BlockTextValue = string | { body: string };

export function BlockText({ value }: BlockComponentProps<BlockTextValue>) {
	const html = typeof value === "string" ? value : value.body;
	return <>{generateRichText(html)}</>;
}
```

- [ ] **Step 5: Create block-image.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-image.tsx`:

```tsx
import type { BlockComponentProps } from "../types/index";
import type { FieldTypeImage } from "@repo/wagtail-cms-types/fields";

export function BlockImage({ value }: BlockComponentProps<FieldTypeImage>) {
	return (
		<figure className="hse-image w-full">
			<picture>
				{value.max_screen_md && (
					<source type="image/webp" srcSet={value.max_screen_md.src} />
				)}
				<img
					src={value.src}
					alt={value.alt}
					className="hse-image__img"
					width={value.width}
					height={value.height}
				/>
			</picture>
		</figure>
	);
}
```

- [ ] **Step 6: Create block-inset-text.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-inset-text.tsx`:

```tsx
import { InsetText } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";
import { generateRichText } from "../utils/generate-rich-text";

type BlockInsetTextValue = { body: string };

export function BlockInsetText({
	value,
}: BlockComponentProps<BlockInsetTextValue>) {
	return <InsetText>{generateRichText(value.body)}</InsetText>;
}
```

- [ ] **Step 7: Create block-quote.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-quote.tsx`:

```tsx
import {
	BlockQuote as DSBlockQuote,
	BlockQuoteCaption,
	BlockQuoteHeading,
	BlockQuoteText,
} from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type BlockQuoteValue = {
	title: string;
	body: string;
	author: string;
};

export function BlockQuote({ value }: BlockComponentProps<BlockQuoteValue>) {
	return (
		<DSBlockQuote>
			{value.title && <BlockQuoteHeading>{value.title}</BlockQuoteHeading>}
			{value.body && <BlockQuoteText>{value.body}</BlockQuoteText>}
			{value.author && <BlockQuoteCaption>{value.author}</BlockQuoteCaption>}
		</DSBlockQuote>
	);
}
```

- [ ] **Step 8: Create block-promo.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-promo.tsx`:

```tsx
import Link from "next/link";
import {
	Col,
	Promo,
	PromoContent,
	PromoDescription,
	PromoHeading,
	Row,
} from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type PromoItem = {
	type: string;
	value: {
		menu_label: string;
		link_text: string;
		link_description: string;
		url?: string;
		link_url?: string;
	};
};

export function BlockPromo({ value }: BlockComponentProps<PromoItem[]>) {
	return (
		<Row className="hse-top-tasks hse-promo-group">
			{value.map((promo, i) => (
				<Col width="one-half" className="hse-promo-group__item" key={promo.value.menu_label || i}>
					<Promo
						asElement={Link}
						href={promo.value.url || promo.value.link_url || ""}
					>
						<PromoContent>
							<PromoHeading>
								{promo.value.menu_label || promo.value.link_text}
							</PromoHeading>
							<PromoDescription>
								{promo.value.link_description}
							</PromoDescription>
						</PromoContent>
					</Promo>
				</Col>
			))}
		</Row>
	);
}
```

- [ ] **Step 9: Create block-links-list.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-links-list.tsx`:

```tsx
import Link from "next/link";
import { LinksList, LinksListItem } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type LinksListValue = {
	lists: Array<{
		heading: string;
		links: Array<{
			menu_label?: string;
			title?: string;
			url: string;
		}>;
	}>;
};

export function BlockLinksList({ value }: BlockComponentProps<LinksListValue>) {
	return (
		<>
			{value.lists.map((item, i) => (
				<LinksList key={item.heading || i} heading={item.heading} headingLevel="h2">
					{item.links.map((link, j) => (
						<LinksListItem key={link.url || j} href={link.url} asElement={Link}>
							{link.menu_label || link.title || ""}
						</LinksListItem>
					))}
				</LinksList>
			))}
		</>
	);
}
```

- [ ] **Step 10: Create block-action-link.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-action-link.tsx`:

```tsx
import Link from "next/link";
import { ActionLink } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type ActionLinkValue = {
	text: string;
	external_url: string;
	new_window: boolean;
	internal_page: { title: string; url: string } | null;
};

export function BlockActionLink({
	value,
}: BlockComponentProps<ActionLinkValue>) {
	if (value.internal_page) {
		return (
			<ActionLink asElement={Link} href={value.internal_page.url}>
				{value.internal_page.title}
			</ActionLink>
		);
	}
	return (
		<ActionLink
			href={value.external_url}
			target={value.new_window ? "_blank" : undefined}
			rel={value.new_window ? "noopener noreferrer" : undefined}
		>
			{value.text}
		</ActionLink>
	);
}
```

- [ ] **Step 11: Create block-details.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-details.tsx`:

```tsx
import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type DetailsValue = {
	title: string;
	body: CMSBlockType[];
};

export function BlockDetails({
	type,
	value,
	renderBlocks,
}: BlockComponentProps<DetailsValue>) {
	return (
		<Details expander={type === "expander"}>
			<Details.Summary>{value.title}</Details.Summary>
			<Details.Text>
				{renderBlocks ? renderBlocks(value.body) : null}
			</Details.Text>
		</Details>
	);
}
```

- [ ] **Step 12: Create block-details-group.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-details-group.tsx`:

```tsx
import { Details } from "@hseireland/hse-frontend-react";
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type DetailsGroupValue = {
	expanders: Array<{
		title: string;
		body: CMSBlockType[];
	}>;
};

export function BlockDetailsGroup({
	value,
	renderBlocks,
}: BlockComponentProps<DetailsGroupValue>) {
	return (
		<Details.ExpanderGroup>
			{value.expanders.map((item) => (
				<Details expander key={item.title}>
					<Details.Summary>{item.title}</Details.Summary>
					<Details.Text>
						{renderBlocks ? renderBlocks(item.body) : null}
					</Details.Text>
				</Details>
			))}
		</Details.ExpanderGroup>
	);
}
```

- [ ] **Step 13: Create block-button.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-button.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type ButtonValue = {
	text: string;
	external_url: string;
	new_window: boolean;
	internal_page: { title: string; url: string } | null;
};

export function BlockButton({ value }: BlockComponentProps<ButtonValue>) {
	if (value.internal_page) {
		return (
			<div className="block-button_list">
				<Button href={value.internal_page.url} asElement={Link}>
					{value.internal_page.title}
				</Button>
			</div>
		);
	}
	return (
		<div className="block-button_list">
			<Button
				href={value.external_url}
				target={value.new_window ? "_blank" : undefined}
				rel={value.new_window ? "noopener noreferrer" : undefined}
			>
				{value.text}
			</Button>
		</div>
	);
}
```

- [ ] **Step 14: Create block-content-block.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-content-block.tsx`:

```tsx
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import type { BlockComponentProps } from "../types/index";

type ContentBlockValue = {
	body?: CMSBlockType[];
};

export function BlockContentBlock({
	value,
	renderBlocks,
}: BlockComponentProps<ContentBlockValue>) {
	if (!value.body || !renderBlocks) return null;
	return <>{renderBlocks(value.body)}</>;
}
```

- [ ] **Step 15: Create block-brightcove.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-brightcove.tsx`:

```tsx
import type { BlockComponentProps } from "../types/index";

type BrightcoveValue = {
	video_id: string;
	account_id: string;
	player_slug: string;
	video_title: string;
	display_video_title: boolean;
	video_description: string;
};

export function BlockBrightcove({
	value,
}: BlockComponentProps<BrightcoveValue>) {
	return (
		<div className="hse-video">
			{value.display_video_title && <h4>{value.video_title}</h4>}
			<p>{value.video_description}</p>
			<div className="embed-responsive">
				<iframe
					title="brightcove-player"
					src={`https://players.brightcove.net/${value.account_id}/default_default/index.html?videoId=${value.video_id}`}
					allow="encrypted-media"
					allowFullScreen
					style={{
						position: "absolute",
						top: "0px",
						right: "0px",
						bottom: "0px",
						left: "0px",
						width: "100%",
						height: "100%",
					}}
				/>
			</div>
		</div>
	);
}
```

- [ ] **Step 16: Create block-related-info.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-related-info.tsx`:

```tsx
import Link from "next/link";
import type { BlockComponentProps } from "../types/index";

type RelatedInfoValue = {
	title: string;
	links: Array<{
		text: string;
		external_url: string;
		new_window: boolean;
		internal_page: { url: string } | null;
	}>;
};

export function BlockRelatedInfo({
	value,
}: BlockComponentProps<RelatedInfoValue>) {
	return (
		<div className="block-related_information">
			<div className="campain-links-list">
				<h3>{value.title}</h3>
				<ul>
					{value.links.map((link) => (
						<li key={link.text}>
							<Link
								href={
									(link.internal_page && link.internal_page.url) ||
									link.external_url
								}
								target={link.new_window ? "_blank" : undefined}
							>
								{link.text}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
```

- [ ] **Step 17: Create block-teaser-links.tsx**

Create `packages/wagtail-cms-mapping/src/blocks/block-teaser-links.tsx`:

```tsx
import Link from "next/link";
import {
	Col,
	Promo,
	PromoContent,
	PromoDescription,
	PromoHeading,
	Row,
} from "@hseireland/hse-frontend-react";
import type { BlockComponentProps } from "../types/index";

type TeaserLinksValue = {
	teaser_links: Array<{
		menu_label: string;
		title: string;
		description: string;
		url: string;
	}>;
};

export function BlockTeaserLinks({
	value,
}: BlockComponentProps<TeaserLinksValue>) {
	return (
		<Row className="hse-promo-group">
			{value.teaser_links.map((link, i) => (
				<Col
					width="one-half"
					className="hse-promo-group__item hse-u-margin-bottom-5"
					key={link.url || i}
				>
					<Promo asElement={Link} href={link.url || "#"}>
						<PromoContent>
							<PromoHeading>
								{link.menu_label || link.title}
							</PromoHeading>
							<PromoDescription>{link.description}</PromoDescription>
						</PromoContent>
					</Promo>
				</Col>
			))}
		</Row>
	);
}
```

- [ ] **Step 18: Create blocks/index.ts registry**

Create `packages/wagtail-cms-mapping/src/blocks/index.ts`:

```typescript
import type { BlockRegistry } from "../types/index";
import { BlockText } from "./block-text";
import { BlockImage } from "./block-image";
import { BlockInsetText } from "./block-inset-text";
import { BlockQuote } from "./block-quote";
import { BlockPromo } from "./block-promo";
import { BlockLinksList } from "./block-links-list";
import { BlockActionLink } from "./block-action-link";
import { BlockDetails } from "./block-details";
import { BlockDetailsGroup } from "./block-details-group";
import { BlockButton } from "./block-button";
import { BlockContentBlock } from "./block-content-block";
import { BlockBrightcove } from "./block-brightcove";
import { BlockRelatedInfo } from "./block-related-info";
import { BlockTeaserLinks } from "./block-teaser-links";
import { BlockFallback } from "./block-fallback";

export const defaultBlockRegistry: BlockRegistry = {
	text: BlockText,
	rich_text_block: BlockText,
	richtext: BlockText,
	image: BlockImage,
	inset_text: BlockInsetText,
	quote: BlockQuote,
	top_tasks: BlockPromo,
	top_task: BlockPromo,
	links_list_group_v2: BlockLinksList,
	action_link: BlockActionLink,
	expander: BlockDetails,
	details: BlockDetails,
	expander_group: BlockDetailsGroup,
	button_list: BlockButton,
	content_block_chooser: BlockContentBlock,
	brightcove_video: BlockBrightcove,
	related_information: BlockRelatedInfo,
	teaser_links: BlockTeaserLinks,
};

export {
	BlockText,
	BlockImage,
	BlockInsetText,
	BlockQuote,
	BlockPromo,
	BlockLinksList,
	BlockActionLink,
	BlockDetails,
	BlockDetailsGroup,
	BlockButton,
	BlockContentBlock,
	BlockBrightcove,
	BlockRelatedInfo,
	BlockTeaserLinks,
	BlockFallback,
};
```

- [ ] **Step 19: Run block tests**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/blocks/`
Expected: PASS

- [ ] **Step 20: Commit**

```bash
git add packages/wagtail-cms-mapping/src/blocks/
git commit -m "feat(wagtail-cms-mapping): add 14 default block components and registry

Includes BlockText, BlockImage, BlockInsetText, BlockQuote, BlockPromo,
BlockLinksList, BlockActionLink, BlockDetails, BlockDetailsGroup,
BlockButton, BlockContentBlock, BlockBrightcove, BlockRelatedInfo,
BlockTeaserLinks, and BlockFallback."
```

---

## Task 7: Default page layout components

**Files:**
- Create: all 6 files in `packages/wagtail-cms-mapping/src/pages/`

- [ ] **Step 1: Write tests for page layouts**

Create `packages/wagtail-cms-mapping/src/pages/pages.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentPage } from "./content-page";
import { LandingPage } from "./landing-page";
import { OrganisationListingPage } from "./organisation-listing-page";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

const mockRenderBlocks = vi.fn((blocks) =>
	blocks.map((b: any) => <div key={b.id} data-testid={`block-${b.id}`} />),
);

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

describe("ContentPage", () => {
	it("renders title and calls renderBlocks with body", () => {
		const page = {
			id: 1,
			title: "Content Page Title",
			meta: makePageMeta("hsebase.ContentPage"),
			header: [],
			body: [{ id: "b1", type: "text", value: "hello" }],
		} as unknown as CMSPageProps;

		render(<ContentPage page={page} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Content Page Title")).toBeInTheDocument();
		expect(mockRenderBlocks).toHaveBeenCalledWith(page.body);
	});
});

describe("LandingPage", () => {
	it("renders title and all content zones", () => {
		const page = {
			id: 2,
			title: "Landing Page Title",
			meta: makePageMeta("hsebase.LandingPage"),
			header: [],
			body: [{ id: "b1", type: "text", value: "main" }],
			top_content: [{ id: "t1", type: "text", value: "top" }],
			bottom_content: [{ id: "bt1", type: "text", value: "bottom" }],
		} as unknown as CMSPageProps;

		render(<LandingPage page={page} renderBlocks={mockRenderBlocks} />);
		expect(screen.getByText("Landing Page Title")).toBeInTheDocument();
		expect(mockRenderBlocks).toHaveBeenCalledWith(page.body);
	});
});

describe("OrganisationListingPage", () => {
	it("renders result count and organisation links", () => {
		const page = {
			id: 3,
			title: "Orgs Page",
			meta: makePageMeta("hsebase.OrganisationListingPage"),
			header: [],
			body: [],
			organisation_links: [{ id: "o1", type: "text", value: "org" }],
			organisation_links_count: 5,
		} as unknown as CMSPageProps;

		render(
			<OrganisationListingPage page={page} renderBlocks={mockRenderBlocks} />,
		);
		expect(screen.getByText("Orgs Page")).toBeInTheDocument();
		expect(screen.getByText(/5 results/)).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/pages/pages.test.tsx`
Expected: FAIL — modules not found

- [ ] **Step 3: Create content-page.tsx**

Create `packages/wagtail-cms-mapping/src/pages/content-page.tsx`:

```tsx
import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isContentPage } from "../types/index";

export function ContentPage({ page, renderBlocks }: PageLayoutProps) {
	const sideNav = isContentPage(page) ? page.side_nav : undefined;

	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<Row>
						<Col width="two-thirds">
							<PageTitle title={page.title} />
							{renderBlocks(page.body)}
						</Col>
						{sideNav && sideNav.length > 0 && (
							<Col width="one-third">
								<aside>
									<nav aria-label="Side navigation">
										<ul>
											{sideNav.map((item) => (
												<li key={item.url}>
													<a href={item.url}>{item.title}</a>
												</li>
											))}
										</ul>
									</nav>
								</aside>
							</Col>
						)}
					</Row>
				</Container>
			</main>
		</>
	);
}
```

- [ ] **Step 4: Create landing-page.tsx**

Create `packages/wagtail-cms-mapping/src/pages/landing-page.tsx`:

```tsx
import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isLandingPage } from "../types/index";

export function LandingPage({ page, renderBlocks }: PageLayoutProps) {
	const lp = isLandingPage(page) ? page : undefined;

	return (
		<>
			{page.breadcrumb && page.breadcrumb.length > 0 && (
				<Breadcrumb items={page.breadcrumb} />
			)}
			<main>
				<Container>
					<PageTitle
						title={page.title}
						richLead={lp?.lead_text}
					/>
					{lp?.top_content && renderBlocks(lp.top_content)}
					{renderBlocks(page.body)}
					{lp?.bottom_content && renderBlocks(lp.bottom_content)}
				</Container>
			</main>
		</>
	);
}
```

- [ ] **Step 5: Create curated-hub-page.tsx**

Create `packages/wagtail-cms-mapping/src/pages/curated-hub-page.tsx`:

```tsx
import { Col, Container, Row } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isCuratedHubPage } from "../types/index";

export function CuratedHubPage({ page, renderBlocks }: PageLayoutProps) {
	const chp = isCuratedHubPage(page) ? page : undefined;

	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<Row>
						<Col width="two-thirds">
							<PageTitle
								title={page.title}
								richLead={chp?.lead_text}
							/>
							{renderBlocks(page.body)}
							{chp?.bottom_content && renderBlocks(chp.bottom_content)}
						</Col>
					</Row>
				</Container>
			</main>
		</>
	);
}
```

- [ ] **Step 6: Create organisation-listing-page.tsx**

Create `packages/wagtail-cms-mapping/src/pages/organisation-listing-page.tsx`:

```tsx
import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationListingPage } from "../types/index";

export function OrganisationListingPage({
	page,
	renderBlocks,
}: PageLayoutProps) {
	const olp = isOrganisationListingPage(page) ? page : undefined;
	const totalItems = olp?.organisation_links_count ?? 0;

	return (
		<>
			<Breadcrumb items={page.breadcrumb} />
			<main>
				<Container>
					<PageTitle
						title={page.title}
						richLead={olp?.lead_text}
					/>
					<div>
						<h2 className="hse-u-margin-bottom-7 hse-heading-m">
							Showing {totalItems} results out of {totalItems}
						</h2>
						{olp?.organisation_links &&
							renderBlocks(olp.organisation_links)}
					</div>
				</Container>
			</main>
		</>
	);
}
```

- [ ] **Step 7: Create organisation-landing-page.tsx**

Create `packages/wagtail-cms-mapping/src/pages/organisation-landing-page.tsx`:

```tsx
import { Container } from "@hseireland/hse-frontend-react";
import { Breadcrumb } from "../components/breadcrumb";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isOrganisationLandingPage } from "../types/index";

export function OrganisationLandingPage({
	page,
	renderBlocks,
}: PageLayoutProps) {
	const olp = isOrganisationLandingPage(page) ? page : undefined;

	return (
		<>
			{page.breadcrumb && page.breadcrumb.length > 0 && (
				<Breadcrumb items={page.breadcrumb} />
			)}
			<main>
				<Container>
					<PageTitle
						title={page.title}
						richLead={olp?.lead_text}
					/>
					{renderBlocks(page.body)}
					{olp?.bottom_content && renderBlocks(olp.bottom_content)}
				</Container>
			</main>
		</>
	);
}
```

- [ ] **Step 8: Create pages/index.ts registry**

Create `packages/wagtail-cms-mapping/src/pages/index.ts`:

```typescript
import type { PageRegistry } from "../types/index";
import { ContentPage } from "./content-page";
import { LandingPage } from "./landing-page";
import { CuratedHubPage } from "./curated-hub-page";
import { OrganisationListingPage } from "./organisation-listing-page";
import { OrganisationLandingPage } from "./organisation-landing-page";

export const defaultPageRegistry: PageRegistry = {
	"hsebase.ContentPage": ContentPage,
	"hsebase.LandingPage": LandingPage,
	"hsebase.CuratedHubPage": CuratedHubPage,
	"hsebase.OrganisationListingPage": OrganisationListingPage,
	"hsebase.OrganisationLandingPage": OrganisationLandingPage,
};

export {
	ContentPage,
	LandingPage,
	CuratedHubPage,
	OrganisationListingPage,
	OrganisationLandingPage,
};
```

- [ ] **Step 9: Run page tests**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run src/pages/`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add packages/wagtail-cms-mapping/src/pages/
git commit -m "feat(wagtail-cms-mapping): add 5 default page layout components and registry

Includes ContentPage, LandingPage, CuratedHubPage,
OrganisationListingPage, and OrganisationLandingPage."
```

---

## Task 8: Full test suite and README

**Files:**
- Create: `packages/wagtail-cms-mapping/README.md`

- [ ] **Step 1: Run full test suite**

Run: `cd packages/wagtail-cms-mapping && pnpm vitest run`
Expected: PASS (all tests)

- [ ] **Step 2: Run typecheck**

Run: `cd packages/wagtail-cms-mapping && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `cd packages/wagtail-cms-mapping && pnpm lint`
Expected: PASS (auto-fixes applied)

- [ ] **Step 4: Create README.md**

Create `packages/wagtail-cms-mapping/README.md`:

````markdown
# @repo/wagtail-cms-mapping

Maps Wagtail CMS data to React components. Ships default block and page layout components using `@hseireland/hse-frontend-react`, with per-app override support via a factory function.

## Quick start

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

const { renderPage } = createCMSRenderer();
```

Zero config gives you all default block and page components.

## Overriding components

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import { MyQuote } from "./components/my-quote";
import { MyContentPage } from "./pages/my-content-page";

const { renderPage, renderBlocks } = createCMSRenderer({
  blocks: {
    quote: MyQuote, // overrides default BlockQuote
  },
  pages: {
    "hsebase.ContentPage": MyContentPage, // overrides default ContentPage layout
  },
});
```

## Usage in a catch-all route

```typescript
// app/[[...slug]]/page.tsx
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import { CMSClient } from "@repo/wagtail-api-client";

const { renderPage } = createCMSRenderer();
const client = new CMSClient({ baseURL: "...", apiPath: "/api/cms/v2" });

export default async function Page({ params }) {
  const { slug } = await params;
  const path = slug ? `/${slug.join("/")}/` : "/";
  const page = await client.findPageByPath(path);
  if (!page || "message" in page) notFound();
  return renderPage(page);
}
```

## Available block components

| Block type(s) | Component | Design system |
|---|---|---|
| `text`, `rich_text_block`, `richtext` | BlockText | html-react-parser |
| `image` | BlockImage | Responsive `<picture>` |
| `inset_text` | BlockInsetText | InsetText |
| `quote` | BlockQuote | BlockQuote |
| `top_tasks`, `top_task` | BlockPromo | Promo |
| `links_list_group_v2` | BlockLinksList | LinksList |
| `action_link` | BlockActionLink | ActionLink |
| `expander`, `details` | BlockDetails | Details |
| `expander_group` | BlockDetailsGroup | Details.ExpanderGroup |
| `button_list` | BlockButton | Button |
| `content_block_chooser` | BlockContentBlock | Recursive renderer |
| `brightcove_video` | BlockBrightcove | iframe embed |
| `related_information` | BlockRelatedInfo | Semantic HTML |
| `teaser_links` | BlockTeaserLinks | Promo |

## Available page layouts

| Page type | Layout |
|---|---|
| `hsebase.ContentPage` | Body (2/3) + optional SideNav (1/3) |
| `hsebase.LandingPage` | Top + Body + Bottom (full width) |
| `hsebase.CuratedHubPage` | Body + Bottom (2/3) |
| `hsebase.OrganisationListingPage` | Result count + Links |
| `hsebase.OrganisationLandingPage` | Body + Bottom (full width) |

## Custom block components

Implement the `BlockComponentProps` interface:

```typescript
import type { BlockComponentProps } from "@repo/wagtail-cms-mapping/types";

type MyValue = { title: string; body: string };

export function MyBlock({ value }: BlockComponentProps<MyValue>) {
  return <div><h2>{value.title}</h2><p>{value.body}</p></div>;
}
```

## Custom page layouts

Implement the `PageLayoutProps` interface:

```typescript
import type { PageLayoutProps } from "@repo/wagtail-cms-mapping/types";

export function MyPage({ page, renderBlocks }: PageLayoutProps) {
  return (
    <main>
      <h1>{page.title}</h1>
      {renderBlocks(page.body)}
    </main>
  );
}
```

## Sub-path exports

| Import | Contents |
|---|---|
| `@repo/wagtail-cms-mapping` | `createCMSRenderer` factory |
| `@repo/wagtail-cms-mapping/blocks` | Default block registry + all block components |
| `@repo/wagtail-cms-mapping/pages` | Default page registry + all page components |
| `@repo/wagtail-cms-mapping/types` | TypeScript types + type guards (no React dependency) |
````

- [ ] **Step 5: Commit**

```bash
git add packages/wagtail-cms-mapping/README.md
git commit -m "docs(wagtail-cms-mapping): add README with usage examples and component reference"
```

---

## Task 9: Update CLAUDE.md and copilot-instructions.md

**Files:**
- Modify: `CLAUDE.md:39-48`
- Modify: `CLAUDE.md:65-66`
- Modify: `.github/copilot-instructions.md:9-17`

- [ ] **Step 1: Add package to CLAUDE.md workspace table**

In `CLAUDE.md`, add a row after `@repo/wagtail-cms-types` (line 43):

```markdown
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | CMS-to-component mapping (source-only, factory pattern) |
```

- [ ] **Step 2: Update CLAUDE.md build conventions**

In `CLAUDE.md`, after line 66, add:

```markdown
- `@repo/wagtail-cms-mapping`: **source-only** -- `exports` map points directly at `.ts`/`.tsx` files (no build step). Factory pattern maps CMS data to React components.
```

- [ ] **Step 3: Update CLAUDE.md CMS content flow**

In `CLAUDE.md`, update the CMS content flow bullet (line 53) to:

```markdown
- **CMS content flow**: `CMSClient` (from `@repo/wagtail-api-client`) fetches data; response shapes validated via Zod schemas in `@repo/wagtail-cms-types`; `createCMSRenderer` (from `@repo/wagtail-cms-mapping`) maps data to React components.
```

- [ ] **Step 4: Add package to copilot-instructions.md table**

In `.github/copilot-instructions.md`, add a row to the packages table:

```markdown
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | CMS-to-component mapping — factory pattern with HSE design system defaults |
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md .github/copilot-instructions.md
git commit -m "docs: add @repo/wagtail-cms-mapping to project documentation"
```

---

## Task 10: Update agentic dev files (agents, prompts, skills)

**Files:**
- Modify: `.github/agents/cms-specialist.agent.md`
- Modify: `.github/agents/react-expert.agent.md`
- Modify: `.github/instructions/cms-packages.instructions.md`
- Modify: `.github/prompts/new-streamfield-block.prompt.md`
- Modify: `.github/prompts/new-page-model.prompt.md`
- Modify: `.github/prompts/new-page-with-blocks.prompt.md`
- Modify: `.github/prompts/integrate-component.prompt.md`
- Modify: `.github/skills/cms-content-fetching/SKILL.md`

This task requires reading each file, locating the TODO placeholders and outdated enums, and updating them. The updates are:

- [ ] **Step 1: Read all files to locate exact update points**

Read each file listed above. Find the `<!-- TODO: wagtail-cms-mapping -->` comments and outdated block/page type lists.

- [ ] **Step 2: Update cms-specialist.agent.md**

Replace the block type enum list with the 18 new keys. Replace the page type enum list with the 5 `hsebase.*` types.

- [ ] **Step 3: Update react-expert.agent.md**

Replace the switch-statement block rendering example with the factory pattern:

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
const { renderBlocks } = createCMSRenderer();
// Use renderBlocks(page.body) instead of manual switch
```

- [ ] **Step 4: Update cms-packages.instructions.md**

Add a new section for `@repo/wagtail-cms-mapping`:
- Sub-path exports (`.`, `./blocks`, `./pages`, `./types`)
- Factory pattern usage
- How to add new block types (register in mapping package)
- How to add new page types (register in mapping package)

Update the block/page type enums throughout.

- [ ] **Step 5: Update new-streamfield-block.prompt.md**

At the TODO placeholder, add steps for:
1. Create block component in `packages/wagtail-cms-mapping/src/blocks/`
2. Add to `defaultBlockRegistry` in `packages/wagtail-cms-mapping/src/blocks/index.ts`
3. Add block key to `CMSBlockComponentsKeysSchema` in `packages/wagtail-cms-types/src/types/blocks/base.ts`

- [ ] **Step 6: Update new-page-model.prompt.md**

At the TODO placeholder, add steps for:
1. Create page layout component in `packages/wagtail-cms-mapping/src/pages/`
2. Add to `defaultPageRegistry` in `packages/wagtail-cms-mapping/src/pages/index.ts`
3. Add page type to `CMSPageTypeSchema` in `packages/wagtail-cms-types/src/types/core/index.ts`
4. Add type guard to `packages/wagtail-cms-mapping/src/types/index.ts`

- [ ] **Step 7: Update new-page-with-blocks.prompt.md**

Update Phase 3 to reference the factory pattern instead of inline switch rendering.

- [ ] **Step 8: Update integrate-component.prompt.md**

Point Steps 3-4 at the mapping package's block registry instead of manual wiring.

- [ ] **Step 9: Update cms-content-fetching SKILL.md**

Update the data flow diagram to include the mapping layer. Replace block/page type lists. Replace switch-based rendering example with factory pattern.

- [ ] **Step 10: Commit**

```bash
git add .github/
git commit -m "docs: update agentic dev files for wagtail-cms-mapping package

Update agents, prompts, skills, and instructions to reference the new
mapping package, factory pattern, and updated block/page type enums."
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full monorepo typecheck**

Run: `pnpm typecheck`
Expected: PASS across all packages

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS across all packages

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4: Verify package is discoverable by Turborepo**

Run: `pnpm ls --filter @repo/wagtail-cms-mapping`
Expected: Shows the package and its dependencies

- [ ] **Step 5: Commit any lint fixes**

If lint made auto-fixes:
```bash
git add -A
git commit -m "style: apply lint fixes"
```
