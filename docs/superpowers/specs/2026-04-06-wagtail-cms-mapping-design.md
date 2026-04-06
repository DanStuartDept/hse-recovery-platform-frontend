# wagtail-cms-mapping Package Design

## Overview

`@repo/wagtail-cms-mapping` is a new monorepo package that bridges CMS data from `@repo/wagtail-api-client` to React components. It provides a factory-based renderer with default components using the HSE design system (`@hseireland/hse-frontend-react`), with per-app override support.

**Data flow:**

```
wagtail-cms-types (Zod schemas)
  -> wagtail-api-client (fetching + validation)
    -> wagtail-cms-mapping (maps data -> components)
      -> Next.js app (renders)
```

## Architecture

### Hybrid factory pattern

The package ships default components for all block types and page layouts. Apps consume them via a factory function that merges defaults with optional overrides:

```typescript
// Zero config — all defaults
const { renderPage } = createCMSRenderer()

// Override specific pieces
const { renderPage } = createCMSRenderer({
  blocks: { quote: MyFancyQuote },
  pages: { 'hsebase.ContentPage': MyContentPage },
})
```

The factory returns three functions:

- `renderBlock(block)` — renders a single block
- `renderBlocks(blocks)` — renders an array of blocks
- `renderPage(page)` — renders a full page using the appropriate layout

Page layouts receive `renderBlocks` as a prop, so they automatically use the correct (potentially overridden) block renderer.

### Source-only package

Like `@repo/wagtail-cms-types`, this package has no build step. The `exports` field in `package.json` points directly at `.ts`/`.tsx` source files. The consuming Next.js app compiles it.

## Package structure

```
packages/wagtail-cms-mapping/
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
  src/
    index.ts                          # createCMSRenderer factory + re-exports
    types/
      index.ts                        # Registry types, component props, renderer options
    blocks/
      index.ts                        # defaultBlockRegistry + barrel exports
      block-text.tsx                  # text, rich_text_block, richtext
      block-image.tsx                 # image
      block-inset-text.tsx            # inset_text
      block-quote.tsx                 # quote
      block-promo.tsx                 # top_tasks, top_task
      block-links-list.tsx            # links_list_group_v2
      block-action-link.tsx           # action_link
      block-details.tsx               # expander, details
      block-details-group.tsx         # expander_group
      block-button.tsx                # button_list
      block-content-block.tsx         # content_block_chooser (recursive)
      block-brightcove.tsx            # brightcove_video
      block-related-info.tsx          # related_information
      block-teaser-links.tsx          # teaser_links
      block-fallback.tsx              # dev-only fallback for unmapped types
    pages/
      index.ts                        # defaultPageRegistry + barrel exports
      content-page.tsx                # hsebase.ContentPage (also default fallback)
      landing-page.tsx                # hsebase.LandingPage
      curated-hub-page.tsx            # hsebase.CuratedHubPage
      organisation-listing-page.tsx   # hsebase.OrganisationListingPage
      organisation-landing-page.tsx   # hsebase.OrganisationLandingPage
```

### Sub-path exports

| Export path | Entry point | Purpose |
|---|---|---|
| `.` | `src/index.ts` | `createCMSRenderer` factory |
| `./blocks` | `src/blocks/index.ts` | Default block registry + components |
| `./pages` | `src/pages/index.ts` | Default page registry + components |
| `./types` | `src/types/index.ts` | Type definitions (no React) |

## Type definitions

```typescript
// src/types/index.ts

import type { ComponentType } from 'react'
import type { CMSBlockType, CMSBlockComponentsKeys } from '@repo/wagtail-cms-types/blocks'
import type { CMSPageProps, CMSPageType } from '@repo/wagtail-cms-types/page-models'

// What a block component receives as props
type BlockComponentProps<TValue = unknown> = {
  id: string
  type: CMSBlockComponentsKeys
  value: TValue
  settings?: { fluid?: boolean; fullWidth?: boolean; inRow?: boolean }
  renderBlocks?: (blocks: CMSBlockType[]) => React.ReactNode[]
}

// What a page layout component receives as props
type PageLayoutProps = {
  page: CMSPageProps
  renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[]
}

// The registries
type BlockRegistry = Partial<Record<CMSBlockComponentsKeys, ComponentType<BlockComponentProps>>>
type PageRegistry = Partial<Record<CMSPageType, ComponentType<PageLayoutProps>>>

// Factory options
type CMSRendererOptions = {
  blocks?: BlockRegistry
  pages?: PageRegistry
  fallbackBlock?: ComponentType<BlockComponentProps>
  fallbackPage?: ComponentType<PageLayoutProps>
}

// Factory return type
type CMSRenderer = {
  renderBlock: (block: CMSBlockType) => React.ReactNode
  renderBlocks: (blocks: CMSBlockType[]) => React.ReactNode[]
  renderPage: (page: CMSPageProps) => React.ReactNode
}
```

### Page type guards

Simple discriminant-based type guards (not Zod `safeParse` — the data is already validated at the API boundary):

```typescript
function isContentPage(page: CMSPageProps): page is CMSContentPageProps {
  return page.meta.type === 'hsebase.ContentPage'
}
// ... one per page type
```

## Block component registry

18 block types mapped to 14 components (some are aliases):

| Block type(s) | Component | Design system usage |
|---|---|---|
| `text`, `rich_text_block`, `richtext` | `BlockText` | `html-react-parser` for rich text HTML |
| `image` | `BlockImage` | Next.js `Image` with responsive variants |
| `inset_text` | `BlockInsetText` | `InsetText` |
| `quote` | `BlockQuote` | `BlockQuote`, `BlockQuoteHeading`, `BlockQuoteText`, `BlockQuoteCaption` |
| `top_tasks`, `top_task` | `BlockPromo` | `Promo`, `PromoContent`, `PromoHeading`, `PromoDescription` |
| `links_list_group_v2` | `BlockLinksList` | `LinksList`, `LinksListItem` |
| `action_link` | `BlockActionLink` | `ActionLink` |
| `expander`, `details` | `BlockDetails` | `Details`, `Details.Summary`, `Details.Text` |
| `expander_group` | `BlockDetailsGroup` | `Details.ExpanderGroup` |
| `button_list` | `BlockButton` | `Button` |
| `content_block_chooser` | `BlockContentBlock` | Recursive — calls `renderBlocks` on snippet body |
| `brightcove_video` | `BlockBrightcove` | Custom `iframe` embed |
| `related_information` | `BlockRelatedInfo` | Custom list with heading + links |
| `teaser_links` | `BlockTeaserLinks` | `Promo` components |
| (unmapped) | `BlockFallback` | Dev: shows block type + JSON value. Prod: renders nothing |

### Recursive rendering

`BlockContentBlock` needs access to `renderBlocks` for nested snippet content. The factory passes `renderBlocks` as an optional prop on `BlockComponentProps`. Only `BlockContentBlock` uses it.

## Page layout registry

5 page types mapped to 5 layout components:

| Page type | Component | Content zones |
|---|---|---|
| `hsebase.ContentPage` | `ContentPage` | Breadcrumbs, Title, Body (2/3 width) + optional SideNav (1/3) |
| `hsebase.LandingPage` | `LandingPage` | Optional breadcrumbs, Title, Top content, Body, Bottom content (all full width) |
| `hsebase.CuratedHubPage` | `CuratedHubPage` | Breadcrumbs, Title, Body (2/3), Bottom content (2/3) |
| `hsebase.OrganisationListingPage` | `OrganisationListingPage` | Breadcrumbs, Title, Result count, Organisation links |
| `hsebase.OrganisationLandingPage` | `OrganisationLandingPage` | Optional breadcrumbs, Title, Body, Bottom content (all full width) |

All layouts use HSE design system grid components: `MainWrapper`, `Container`, `Row`, `Col`, `Breadcrumb`.

`ContentPage` doubles as the fallback for unmapped page types.

## Changes to @repo/wagtail-cms-types

### Block types — replace enum

Replace `CMSBlockComponentsKeysSchema` (currently 23 types) with the 18 types from the reference backend:

```typescript
z.enum([
  'text', 'rich_text_block', 'richtext', 'image', 'inset_text', 'quote',
  'top_tasks', 'top_task', 'links_list_group_v2', 'action_link',
  'expander', 'expander_group', 'details', 'button_list',
  'content_block_chooser', 'brightcove_video', 'related_information', 'teaser_links',
])
```

### Page types — replace enum and models

Replace `CMSPageTypeSchema` (currently 6 types with `appbase`/`news` prefixes) with 5 types using `hsebase`:

```typescript
z.enum([
  'hsebase.ContentPage',
  'hsebase.LandingPage',
  'hsebase.CuratedHubPage',
  'hsebase.OrganisationListingPage',
  'hsebase.OrganisationLandingPage',
])
```

### Page model schemas

Replace `src/types/page-models/appbase.ts` with `src/types/page-models/hsebase.ts`:

| Schema | Extends `CMSPageWithBlocks` with |
|---|---|
| `CMSContentPagePropsSchema` | `side_nav?: NavItem[]` |
| `CMSLandingPagePropsSchema` | `top_content?: BaseCMSBlockType[]`, `bottom_content?: BaseCMSBlockType[]` |
| `CMSCuratedHubPagePropsSchema` | `bottom_content?: BaseCMSBlockType[]` |
| `CMSOrganisationLandingPagePropsSchema` | `bottom_content?: BaseCMSBlockType[]` |
| `CMSOrganisationListingPagePropsSchema` | `organisation_links: BaseCMSBlockType[]`, `organisation_links_count: number` |

Remove `src/types/page-models/news.ts` entirely.

### Unchanged

- `src/types/core/` — generic Wagtail API shapes (queries, metadata, pagination)
- `src/types/fields/` — image, CTA, video, nav item schemas
- `src/types/settings/` — header, footer, social links
- `src/types/snippets/` — SnippetContentBlock

## Testing strategy

### Unit tests for the factory

- `createCMSRenderer()` returns all three functions
- Default registries are used when no overrides provided
- Override blocks merge correctly (default + override, override wins)
- Override pages merge correctly
- Custom fallbackBlock is used for unmapped block types
- Custom fallbackPage is used for unmapped page types
- `renderBlocks([])` returns empty array
- `renderBlocks` with mixed known/unknown types renders components + fallbacks

### Unit tests for block components

Each block component gets a test file verifying:

- Renders correct design system component for the given block value
- Handles missing optional fields gracefully
- Alias block types render the same component (e.g., `text` and `richtext` both render `BlockText`)

### Unit tests for page layouts

Each page layout gets a test file verifying:

- Renders correct content zones (breadcrumbs, title, body, etc.)
- Calls `renderBlocks` with the correct block arrays
- Handles optional fields (e.g., `side_nav`, `top_content`)
- Type guard correctly narrows the page type

### Test tooling

- Vitest with `createVitestConfig()` from `@repo/vitest-config`
- `jsdom` environment (React component rendering)
- `@testing-library/react` for component tests
- Coverage target: match existing monorepo standards

## README

The package will include a `README.md` covering:

- What the package does (one paragraph)
- Installation (workspace dependency)
- Quick start (zero-config usage)
- Overriding blocks and pages (with examples)
- Available block components (table)
- Available page layouts (table)
- Type reference (exported types)
- Creating custom block components (prop interface)
- Creating custom page layouts (prop interface)

## Dependencies

### Runtime

- `@repo/wagtail-cms-types` (workspace:*)
- `@hseireland/hse-frontend-react` (catalog:)
- `react` (catalog:)
- `html-react-parser` (for rich text rendering in BlockText)
- `next` (catalog:) — for Next.js `Image` component in BlockImage

### Dev

- `@repo/vitest-config` (workspace:*)
- `@repo/typescript-config` (workspace:*)
- `@repo/biome-config` (workspace:*)
- `@testing-library/react`
- `@testing-library/jest-dom`
- `vitest`

## Documentation and agentic dev file updates

### CLAUDE.md

Add `@repo/wagtail-cms-mapping` to the workspace layout table.

### Critical — files with existing TODO placeholders

| File | Update needed |
|---|---|
| `.github/prompts/new-streamfield-block.prompt.md` | Add step for registering block in mapping package registry |
| `.github/prompts/new-page-model.prompt.md` | Add step for registering page in mapping package registry |
| `.github/prompts/new-page-with-blocks.prompt.md` | Update all workflow steps to use factory pattern |
| `.github/prompts/integrate-component.prompt.md` | Point block registration at mapping package |
| `.github/skills/cms-content-fetching/SKILL.md` | Update data flow diagram, block/page type lists, rendering examples to use factory |
| `.github/instructions/cms-packages.instructions.md` | Add `@repo/wagtail-cms-mapping` section, update block/page enums |

### High — should update

| File | Update needed |
|---|---|
| `.github/copilot-instructions.md` | Add `@repo/wagtail-cms-mapping` to package table |
| `.github/agents/cms-specialist.agent.md` | Replace block type enum (18 types) and page type enum (5 types with `hsebase` prefix) |
| `.github/agents/react-expert.agent.md` | Replace switch-based block rendering example with factory pattern |

### Medium — may need updates

| File | Update needed |
|---|---|
| `.github/instructions/typescript.instructions.md` | Add source-only pattern note for mapping package |
| `.github/agents/nextjs-developer.agent.md` | Update CMS import examples to include mapping package |

## Out of scope

- Header/footer settings mapping — will be designed separately
- Wiring into `hse-app-template` (catch-all route, layout, CMS client config) — separate task after this package is built
- Preview/draft mode support — separate task
- Rich text link handling (internal link rewriting) — will be addressed when wiring into the app
