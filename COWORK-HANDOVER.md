# Claude Cowork Handover — HSE Recovery Platform Frontend

> **Last updated:** 2026-04-01
> **Purpose:** Onboard a new Claude Code session (or human developer) with full context on the frontend monorepo, plus a lighter overview of the Wagtail CMS backend and Cloudflare deployment infrastructure.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Frontend Monorepo](#2-frontend-monorepo)
   - [Workspace Layout](#workspace-layout)
   - [The Next.js App](#the-nextjs-app-hse-app-template)
   - [CMS Client Package](#cms-client-package-repowagtail-api-client)
   - [CMS Types Package](#cms-types-package-repowagtail-cms-types)
   - [Supporting Packages](#supporting-packages)
3. [Content Model](#3-content-model)
4. [Design System](#4-design-system)
5. [Backend Overview (Wagtail CMS)](#5-backend-overview-wagtail-cms)
6. [DevOps & Deployment](#6-devops--deployment)
7. [Developer Workflow](#7-developer-workflow)
8. [Current State & Roadmap Context](#8-current-state--roadmap-context)

---

## 1. Platform Overview

The HSE Recovery Platform is a CMS-driven public web application for the Health Service Executive (Ireland). The architecture has three layers:

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers (Edge)                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js 16 App Router (SSR at the edge)          │  │
│  │  ├── Server Components fetch from Wagtail API     │  │
│  │  ├── HSE Design System renders UI                 │  │
│  │  └── ISR with 360s revalidation                   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (REST API)
┌────────────────────────▼────────────────────────────────┐
│  Wagtail CMS Backend                                    │
│  ├── Django / Wagtail headless CMS                      │
│  ├── REST API at /api/cms/v2/                           │
│  ├── Page types: Home, Landing, Content, Search, News   │
│  ├── StreamField blocks (22 block types)                │
│  └── Site settings (header, footer, SEO, alerts)        │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **Headless CMS** — Wagtail serves content via REST API only; the frontend owns all rendering.
- **Edge rendering** — Next.js runs on Cloudflare Workers globally, not a single-origin Node.js server.
- **Type-safe pipeline** — Every CMS response is validated through Zod schemas before use.
- **HSE Design System first** — Use `@hseireland/hse-frontend-react` components before writing custom UI.

---

## 2. Frontend Monorepo

**Stack:** pnpm 10.33 + Turborepo + Next.js 16 + React 19 + TypeScript 5.9
**Node:** >= 24 (required)

### Workspace Layout

| npm name | Path | Role | Build |
|---|---|---|---|
| `hse-app-template` | `apps/hse-app-template` | Next.js 16 App Router application | Next.js |
| `@repo/wagtail-api-client` | `packages/wagtail-cms-client` | Wagtail REST client (`CMSClient`) | bunchee → ESM + CJS |
| `@repo/wagtail-cms-types` | `packages/wagtail-cms-types` | Zod schemas for all CMS content | Source-only (no build) |
| `@repo/logger` | `packages/logger` | Console wrapper with "LOGGER: " prefix | bunchee → ESM |
| `@repo/vitest-config` | `packages/config-vitest` | Shared `createVitestConfig()` factory | Source-only |
| `@repo/biome-config` | `packages/biome-config` | Shared Biome linting rule sets | JSON configs |
| `@repo/typescript-config` | `packages/config-typescript` | Shared tsconfig bases | JSON configs |
| `@repo/commitlint-config` | `packages/commitlint-config` | Conventional Commits config | JS config |

**Dependency graph:**
```
hse-app-template
├── @repo/wagtail-api-client
│   └── @repo/wagtail-cms-types
├── @repo/wagtail-cms-types (direct, for page model types)
├── @repo/logger
├── @hseireland/hse-frontend (CSS/tokens)
└── @hseireland/hse-frontend-react (React components)
```

### The Next.js App (`hse-app-template`)

**Location:** `apps/hse-app-template`

**Current structure:**
```
src/
└── app/
    ├── layout.tsx      ← Root layout, imports HSE design system SCSS
    └── page.tsx        ← Home page (minimal template)
```

**Key configuration files:**

| File | Purpose |
|---|---|
| `next.config.ts` | Minimal — calls `initOpenNextCloudflareForDev()` for local Cloudflare bindings |
| `wrangler.jsonc` | Cloudflare Workers config — bindings, assets, image optimization |
| `open-next.config.ts` | OpenNext adapter config (defaults, with commented R2 cache example) |
| `cloudflare-env.d.ts` | Auto-generated types for Cloudflare bindings (run `pnpm run cf-typegen`) |
| `biome.json` | Extends `@repo/biome-config/base` + `@repo/biome-config/next-js` |

**Cloudflare bindings available at runtime:**
```typescript
interface CloudflareEnv {
  IMAGES: ImagesBinding;          // Cloudflare image optimization
  ASSETS: Fetcher;                // Static asset serving
  NEXTJS_ENV: string;             // Environment indicator
  WORKER_SELF_REFERENCE: Fetcher; // Self-reference for caching
}
```

Access these via `getCloudflareContext()` in server components — **not** `process.env` (only string vars work there).

**Runtime constraints:** This runs on Cloudflare Workers, not Node.js. No `fs`, `child_process`, or other Node-specific APIs at runtime. The `nodejs_compat` flag provides some polyfills but not full Node.

### CMS Client Package (`@repo/wagtail-api-client`)

**Location:** `packages/wagtail-cms-client`

The `CMSClient` class is the single entry point for all CMS data fetching.

**Instantiation:**
```typescript
import { CMSClient } from "@repo/wagtail-api-client";

const cms = new CMSClient({
  baseURL: "https://cms.example.com",    // No trailing slash
  apiPath: "/api/cms/v2",                // Wagtail API path
  mediaBaseURL: "https://media.example.com", // Optional
});
```

**API surface:**

| Method | Purpose |
|---|---|
| `fetchPage(idOrSlug)` | Single page by numeric ID or string slug |
| `findPageByPath(path)` | Find page by URL path (uses `html_path` query) |
| `fetchPages(queries?)` | Paginated page listing with filters |
| `fetchPagePreview(contentType, token, id)` | Wagtail preview mode |
| `fetchImage(id)` / `fetchImages()` | Image content |
| `fetchDocument(id)` / `fetchDocuments()` | Document content |
| `fetchContent(contentPath, queries?)` | Generic endpoint fetch |
| `fetchEndpoint(path)` | Raw path fetch with error handling |
| `getMediaSrc(media)` | Construct full media URL from meta |

**Caching:** Default `next: { revalidate: 360 }` (ISR, 6-minute stale window). Override per-request via `init` parameter.

**Error handling:** Returns `{ message, data }` (NotFoundContents type) on failure rather than throwing — callers check the response shape.

**Query parameters** (via `CMSQueries` type):
- Pagination: `offset`, `limit`, `order`
- Tree filtering: `child_of`, `ancestor_of`, `descendant_of` (pages only)
- Search: `search`, `search_operator`
- Localisation: `locale`, `translation_of`
- Field selection: `fields[]`
- Menu filtering: `show_in_menus`

### CMS Types Package (`@repo/wagtail-cms-types`)

**Location:** `packages/wagtail-cms-types`
**Build:** None — exports raw `.ts` files via sub-path exports.

**Import pattern:**
```typescript
import { CMSAppBaseHomePagePropsSchema } from "@repo/wagtail-cms-types/page-models";
import { CMSPageMetaSchema } from "@repo/wagtail-cms-types/core";
import { BaseCMSBlockTypeSchema } from "@repo/wagtail-cms-types/blocks";
import { FieldTypeImageSchema } from "@repo/wagtail-cms-types/fields";
import { CMSSiteSettingsItemSchema } from "@repo/wagtail-cms-types/settings";
import { SnippetContentBlockSchema } from "@repo/wagtail-cms-types/snippets";
```

**Page type hierarchy:**
```
CMSPageContentSchema (base: id, title, meta, breadcrumb)
└── CMSPageWithBlocksSchema (adds: header[], body[])
    ├── CMSAppBaseHomePagePropsSchema
    ├── CMSAppBaseLandingPagePropsSchema
    ├── CMSAppBaseContentPagePropsSchema  (+lead_text, side_nav, disable_navigation)
    ├── CMSAppBaseSearchPagePropsSchema
    ├── CMSNewsListingPagePropsSchema
    └── CMSNewsContentPagePropsSchema     (+lead_text, published_date, featured_image)
```

**Page type enum values:**
- `appbase.HomePage`, `appbase.LandingPage`, `appbase.ContentPage`, `appbase.SearchPage`
- `news.NewsListingPage`, `news.NewsContentPage`

**Block component types (22):**
`content_block`, `alert`, `page_header`, `text`, `text_picture`, `picture`, `group`, `title_and_text`, `row`, `accordion`, `cta`, `cta_panel`, `card`, `text_and_icon`, `cover`, `quote`, `section_listing`, `hero_image_banner`, `youtube`, `team_member`, `timeline`, `demo_ui_banner`

**Settings model (`CMSSiteSettingsItemSchema`):**
Contains header navigation, footer columns, social links, default OG/Twitter meta, global alert, search config, 404 page reference, robots config, maintenance mode flag, and default news featured image.

### Supporting Packages

**`@repo/logger`** — Thin `console.log` wrapper prefixed with `"LOGGER: "`. Designed to be swapped for a proper log drain later.

**`@repo/vitest-config`** — `createVitestConfig({ environment?, include?, exclude?, setupFile? })` factory. Default environment is `jsdom`. Ships Next.js navigation mocks (`mockNextNavigation()`) for testing components that use `useRouter`, `usePathname`, etc.

**`@repo/biome-config`** — Three configs: `base` (general TS), `next-js` (React/Next rules), `react-internal` (library builds). Enforces: tabs, double quotes, no `any`, no CommonJS, sorted imports.

**`@repo/typescript-config`** — Bases: `base.json`, `nextjs.json`, `react-library.json`, `vite.json`. All use strict mode, ESNext modules, bundler resolution.

**`@repo/commitlint-config`** — Conventional Commits with scopes: `apps`, `packages`, `configs`, `gh-actions`, `deps`, `deps-dev`.

---

## 3. Content Model

Content flows from Wagtail CMS through the typed pipeline:

```
Wagtail CMS (authoring)
  → REST API (/api/cms/v2/)
    → CMSClient.fetchPage() / .fetchPages()
      → Zod schema validation
        → Typed props in React Server Components
          → HSE Design System components render UI
```

**Pages** are the primary content unit. Each page has:
- **Meta:** slug, type, locale, URLs, SEO fields, publish dates, parent reference
- **Breadcrumbs:** Array of `{ id, title, slug, url }`
- **Header blocks:** Array of StreamField blocks (typically page_header, hero_image_banner)
- **Body blocks:** Array of StreamField blocks (the main content area)

**Blocks** follow a consistent shape:
```typescript
{
  id: string;
  type: "text" | "accordion" | "cta" | /* ... 19 more */;
  value: unknown;     // Block-specific payload
  settings?: { fluid?, fullWidth?, inRow? };  // Display settings
}
```

**Images** include responsive variants:
- Named sizes: `max_screen_sm`, `max_screen_md`, `max_screen_lg`, `max_screen_xl`, `max_screen_2xl`, `max_screen_1920`
- Thumbnails: `120x120`, `400x400`
- Each variant: `{ src, alt, width, height }`

**Site settings** are a singleton providing:
- Header: global nav links, navigation links (with mega-menu structure), popular search terms
- Footer: navigation columns with links
- Social links
- Default SEO metadata (OG and Twitter)
- Global alert banner
- Search configuration
- 404 page reference
- Robots/maintenance mode flags

---

## 4. Design System

The HSE Ireland design system is distributed as two packages from GitHub Packages (`@hseireland:registry=https://npm.pkg.github.com`):

| Package | Version | Purpose |
|---|---|---|
| `@hseireland/hse-frontend` | 5.0.0 | SCSS design tokens, base styles, component CSS |
| `@hseireland/hse-frontend-react` | 5.3.0 | React component library |

**Integration:**
- SCSS imported globally in root layout: `@hseireland/hse-frontend/packages/hse.scss`
- React components imported where needed (e.g., `Container` from `@hseireland/hse-frontend-react`)
- No Tailwind CSS — the design system provides all styling
- No CSS-in-JS — component styles come from the design system SCSS

**Rule:** Always check the design system for an existing component before writing custom UI.

---

## 5. Backend Overview (Wagtail CMS)

> This section provides context for frontend developers. The backend is a separate repository.

**Technology:** Python / Django / Wagtail (headless mode)

**API endpoint:** `/api/cms/v2/` — Wagtail's built-in REST API, likely extended with custom serializers for the block types and settings.

**Content authoring model:**
- **Pages** use Wagtail's page tree (hierarchical). Each page type maps to a Django model with StreamField for block content.
- **StreamField blocks** are the primary content building blocks. Editors compose pages by stacking blocks (text, images, CTAs, accordions, etc.).
- **Snippets** are reusable content fragments (e.g., `SnippetContentBlock`) that can be embedded in pages via the `content_block` block type.
- **Site settings** are Wagtail `BaseSiteSetting` models providing global configuration.
- **Images and documents** use Wagtail's built-in media library with custom rendition sizes.

**Page types defined in the backend:**

| Wagtail Type | Frontend Schema | Notes |
|---|---|---|
| `appbase.HomePage` | `CMSAppBaseHomePagePropsSchema` | Site root |
| `appbase.LandingPage` | `CMSAppBaseLandingPagePropsSchema` | Section landing pages |
| `appbase.ContentPage` | `CMSAppBaseContentPagePropsSchema` | Standard content (+ side nav, lead text) |
| `appbase.SearchPage` | `CMSAppBaseSearchPagePropsSchema` | Search results page |
| `news.NewsListingPage` | `CMSNewsListingPagePropsSchema` | News index |
| `news.NewsContentPage` | `CMSNewsContentPagePropsSchema` | Individual news article |

**Preview support:** The API exposes preview endpoints. The frontend's `fetchPagePreview(contentType, token, id)` method supports Wagtail's draft preview workflow, allowing editors to preview unpublished changes.

**What the frontend needs from the backend:**
- A running Wagtail instance with the REST API enabled
- Correct CORS headers for the frontend domain
- Consistent API shape matching the Zod schemas in `@repo/wagtail-cms-types`
- Image renditions generated at the expected sizes

---

## 6. DevOps & Deployment

### Build & Deploy Pipeline

```
pnpm build                          # Turbo builds all packages in dependency order
                                    # packages/wagtail-cms-types → (no build)
                                    # packages/logger → bunchee → dist/
                                    # packages/wagtail-cms-client → bunchee → dist/
                                    # apps/hse-app-template → next build → .next/

cd apps/hse-app-template
pnpm run deploy                     # 1. opennextjs-cloudflare build → .open-next/
                                    # 2. wrangler deploy → Cloudflare Workers
```

### Cloudflare Workers Runtime

The app runs on Cloudflare's edge network as a Worker. Key characteristics:
- **No persistent filesystem** — all state is ephemeral per-request
- **No Node.js runtime** — Workers use V8 isolates with `nodejs_compat` polyfills
- **Global distribution** — code runs at the nearest Cloudflare PoP to the user
- **Cold starts** are fast (~5ms) compared to Lambda/containers

**Configured bindings:**

| Binding | Type | Purpose |
|---|---|---|
| `IMAGES` | ImagesBinding | Cloudflare Image Optimization (resize, format conversion) |
| `ASSETS` | Fetcher | Serve static files from `.open-next/assets` |
| `WORKER_SELF_REFERENCE` | Service | Self-referencing service binding for cache control |
| `NEXTJS_ENV` | String | Environment indicator (development/staging/production) |

### Caching Strategy

- **Static assets:** `Cache-Control: public, max-age=31536000, immutable` (content-hashed filenames)
- **CMS content:** Next.js ISR with 360-second revalidation (configured in the fetch layer)
- **Cloudflare cache:** The `WORKER_SELF_REFERENCE` binding enables Cloudflare's CDN cache for dynamic responses
- **Future:** `open-next.config.ts` has commented scaffolding for R2-backed incremental cache

### Environments

| Environment | Config | Notes |
|---|---|---|
| Local dev | `pnpm dev` | Next.js dev server + Cloudflare bindings via `initOpenNextCloudflareForDev()` |
| Local preview | `pnpm run preview` | Full Cloudflare Workers runtime locally via Miniflare |
| Production | `pnpm run deploy` | Deployed to Cloudflare Workers via Wrangler |

**Environment variables** are managed in:
- `wrangler.jsonc` → `vars` section (production)
- `.dev.vars` → local overrides (gitignored)
- Cloudflare dashboard → secrets (API keys, etc.)

### CI/CD

No GitHub Actions workflows are configured yet. Current deployment is manual via `pnpm run deploy`. The monorepo is CI-ready with:
- `pnpm test:ci` — Vitest with V8 coverage + Sonar reporter + JUnit output
- `pnpm lint` — Biome auto-fix
- `pnpm typecheck` — Full type checking
- Turbo caching for incremental builds

---

## 7. Developer Workflow

### Getting Started

```bash
# Prerequisites: Node.js >= 24, pnpm 10.33.0
# GitHub Packages access configured in .npmrc for @hseireland packages

pnpm install          # Install all workspace dependencies
pnpm build            # Build packages in dependency order
pnpm dev              # Start all dev servers
```

### Common Commands

```bash
# Full workspace
pnpm build            # Build everything
pnpm dev              # Dev servers (persistent)
pnpm test             # Run all tests
pnpm lint             # Biome check --write (auto-fixes)
pnpm typecheck        # tsc --noEmit

# Filter to one workspace
turbo run dev --filter=hse-app-template
turbo run test --filter=@repo/wagtail-api-client

# Single test file
cd packages/wagtail-cms-client && pnpm vitest run src/lib/fetchContent.test.ts

# Cloudflare
cd apps/hse-app-template
pnpm run cf-typegen   # Regenerate cloudflare-env.d.ts
pnpm run preview      # Local Cloudflare Workers preview
pnpm run deploy       # Deploy to Cloudflare Workers
```

### Code Conventions

| Area | Convention |
|---|---|
| Linter/Formatter | Biome v2 (tabs, indent 2, line width 120, double quotes) |
| Commits | Conventional Commits — scopes: `apps`, `packages`, `configs`, `gh-actions`, `deps`, `deps-dev` |
| Components | Server Components by default; `"use client"` only when needed |
| Styling | HSE Design System only — no Tailwind, no CSS-in-JS |
| Types | Strict mode, no `any`, Zod for runtime validation |
| Imports | Internal packages use `"workspace:*"`, externals use `"catalog:"` from pnpm catalog |
| Testing | Vitest + jsdom (default), node env for server packages |
| Markdown | Formatted with Prettier (`pnpm format`) |

### Dependency Management

External dependency versions are pinned in `pnpm-workspace.yaml` under `catalog:`. To add or update a dependency:

1. Add/update the version in `pnpm-workspace.yaml` → `catalog:`
2. Reference it as `"catalog:"` in the relevant `package.json`
3. Run `pnpm install`

HSE design system packages require GitHub Packages authentication (configured in `.npmrc`).

---

## 8. Current State & Roadmap Context

### What exists now

The monorepo infrastructure is complete and production-ready:
- All shared packages are built, tested, and working
- The CMS client has full API coverage for Wagtail's REST API
- Zod schemas cover all known page types, blocks, fields, settings, and snippets
- The Next.js app has a working Cloudflare Workers deployment pipeline
- The HSE design system is integrated and rendering

### What's still to build

The app currently has a single minimal page (`src/app/page.tsx`). The major implementation work ahead:

1. **CMS page routing** — Dynamic `[...slug]` catch-all route that maps URL paths to Wagtail pages via `findPageByPath()`
2. **Page templates** — React components for each page type (Home, Landing, Content, Search, News Listing, News Article)
3. **Block components** — React components for each of the 22 StreamField block types
4. **Site settings integration** — Header/footer/navigation fetched from CMS settings API
5. **CMS-to-component mapping** — A mapping layer that connects CMS page types to templates and block types to components (planned as a `@repo/wagtail-cms-mapping` package)
6. **Search** — Integration with Wagtail's search API via the Search page type
7. **Preview mode** — Wagtail draft preview integration for content editors
8. **CI/CD** — GitHub Actions for build, test, deploy pipeline
9. **Error handling** — Custom 404/500 pages sourced from CMS settings

---

*This document is intended as a conversation starter for Claude Code sessions. For authoritative build/test commands and conventions, always defer to `CLAUDE.md` at the repo root.*
