# Copilot Agentic Development Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the full GitHub Copilot agentic setup (agents, instructions, prompts, skills) so every developer gets consistent AI-assisted workflows.

**Architecture:** Skills are the shared knowledge layer (cross-tool portable). Agents are thin persona wrappers referencing skills. Instructions are scoped to file patterns. Prompts guide cross-package workflows.

**Tech Stack:** Markdown files with YAML frontmatter (Copilot agent/instruction/prompt format), agentskills.io skill format.

**Spec:** `docs/superpowers/specs/2026-04-06-copilot-agentic-setup-design.md`

---

## Task 1: Create Skills (Shared Knowledge Layer)

Skills must be created first — agents and prompts reference them. These are the portable, cross-tool knowledge files.

**Files:**

- Create: `.github/skills/cms-content-fetching/SKILL.md`
- Create: `.github/skills/hse-design-system/SKILL.md`
- Create: `.github/skills/conventional-commit/SKILL.md`

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p .github/skills/cms-content-fetching .github/skills/hse-design-system .github/skills/conventional-commit`

- [ ] **Step 2: Create `cms-content-fetching/SKILL.md`**

This skill teaches the full CMS data flow. Reference the actual types/client from the codebase.

```markdown
---
name: CMS Content Fetching
description: Teaches the full CMS data flow from Wagtail API through typed client to React rendering
---

# CMS Content Fetching

This skill teaches how content flows from the Wagtail CMS backend to rendered React components in this monorepo.

## Data Flow Overview
```

Wagtail CMS Backend (REST API v2)
↓
@repo/wagtail-api-client (CMSClient class)
↓
@repo/wagtail-cms-types (Zod validation)
↓
Next.js App (Server Components → React rendering)

````

<!-- TODO: wagtail-cms-mapping — a mapping layer will sit between Client and Rendering steps when the @repo/wagtail-cms-mapping package is created -->

## Layer 1: Types (`@repo/wagtail-cms-types`)

Source-only package — no build step. Exports raw `.ts` files via sub-path exports:

| Import path | Contents |
|---|---|
| `@repo/wagtail-cms-types/core` | `ClientOptions`, `CMSPageType`, `CMSQueries`, `CMSContent`, `CMSPageContent`, `CMSContents` |
| `@repo/wagtail-cms-types/blocks` | `CMSBlockComponentsKeys` (22 block types), `BaseCMSBlockType`, `BlockValuesProps` |
| `@repo/wagtail-cms-types/fields` | `FieldTypeCta`, `FieldTypeImage`, `FieldTypeVideo`, `FieldTypeHeadingLevel`, `NavItem` |
| `@repo/wagtail-cms-types/page-models` | `CMSPageWithBlocks`, `CMSPageProps` (union of all 6 page types) |
| `@repo/wagtail-cms-types/settings` | `CMSSiteSettingsItem` (header, footer, social, alerts, search, SEO) |
| `@repo/wagtail-cms-types/snippets` | `SnippetContentBlock` (reusable content blocks) |

### Page Types

Six page models defined in `CMSPageType`:
- `appbase.HomePage`, `appbase.LandingPage`, `appbase.ContentPage`, `appbase.SearchPage`
- `news.NewsListingPage`, `news.NewsContentPage`

All extend `CMSPageWithBlocks` which provides `header: Block[]` and `body: Block[]`.

### Block Types

22 block types in `CMSBlockComponentsKeys`:
`content_block`, `alert`, `page_header`, `text`, `text_picture`, `picture`, `group`, `title_and_text`, `row`, `accordion`, `cta`, `cta_panel`, `card`, `text_and_icon`, `cover`, `quote`, `section_listing`, `hero_image_banner`, `youtube`, `team_member`, `timeline`, `demo_ui_banner`

Each block has: `{ id, type, value, settings?, client? }` where `type` is the discriminant.

### Zod Schema Pattern

All types use Zod for runtime validation and TypeScript inference:

```typescript
import { z } from "zod";

// Define schema
export const MyPageSchema = CMSPageWithBlocksSchema.extend({
  custom_field: z.string().optional(),
});

// Infer type
export type MyPage = z.infer<typeof MyPageSchema>;
````

## Layer 2: Client (`@repo/wagtail-api-client`)

`CMSClient` class — instantiate with connection options, call methods to fetch content.

### Configuration

```typescript
import { CMSClient } from "@repo/wagtail-api-client";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL, // e.g. "https://cms.example.com"
  apiPath: "/api/cms/v2", // Wagtail API path
  mediaBaseURL: process.env.MEDIA_URL, // Optional separate media domain
});
```

### Key Methods

| Method                                               | Purpose                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `fetchPage(idOrSlug, queries?, init?)`               | Fetch single page by ID or slug                              |
| `fetchPages(queries?, init?)`                        | Fetch page listing with filters                              |
| `findPageByPath<T>(path, init?)`                     | Resolve URL path to page (uses Wagtail's `find/?html_path=`) |
| `fetchPagePreview<T>(contentType, token, id, init?)` | Fetch draft preview                                          |
| `fetchImage(id, queries?, init?)`                    | Fetch image by ID                                            |
| `fetchDocument(id, queries?, init?)`                 | Fetch document by ID                                         |
| `getMediaSrc(media)`                                 | Construct full media URL from `CMSMediaMeta`                 |

### ISR Caching

All fetch requests include `next: { revalidate: 360 }` by default (6-minute ISR).

## Wagtail API v2 Reference

### Endpoints

- Pages: `GET /api/v2/pages/`
- Images: `GET /api/v2/images/`
- Documents: `GET /api/v2/documents/`
- Find by path: `GET /api/v2/pages/find/?html_path=/about/` (returns 302 redirect to detail view)

### Query Parameters

| Parameter       | Example                        | Purpose                              |
| --------------- | ------------------------------ | ------------------------------------ |
| `type`          | `?type=news.NewsContentPage`   | Filter by page model                 |
| `fields`        | `?fields=title,body,lead_text` | Select specific fields (`*` for all) |
| `child_of`      | `?child_of=5`                  | Direct children of page ID           |
| `descendant_of` | `?descendant_of=5`             | All descendants                      |
| `ancestor_of`   | `?ancestor_of=10`              | All ancestors                        |
| `slug`          | `?slug=about`                  | Exact match on slug                  |
| `search`        | `?search=mental+health`        | Full-text search                     |
| `order`         | `?order=-first_published_at`   | Sort (prefix `-` for descending)     |
| `locale`        | `?locale=en`                   | Filter by locale                     |
| `limit`         | `?limit=10`                    | Items per page (default 20)          |
| `offset`        | `?offset=20`                   | Skip N items                         |

### Pagination

Responses include `meta.total_count` for total results. Combine `limit` + `offset` for pagination.

## Layer 3: Rendering (Next.js App)

Fetch in Server Components, validate with Zod, render blocks by discriminating on `type`.

### Common Pattern: Fetch Page by Path

```typescript
// app/[...slug]/page.tsx (Server Component)
import { CMSClient } from "@repo/wagtail-api-client";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

const client = new CMSClient({ baseURL: "...", apiPath: "/api/cms/v2" });

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const page = await client.findPageByPath<CMSPageProps>(path);

  if ("error" in page) return notFound();

  return <PageRenderer page={page} />;
}
```

### Common Pattern: Render Block Union

```typescript
function BlockRenderer({ block }: { block: BaseCMSBlockType }) {
  switch (block.type) {
    case "text":
      return <TextBlock value={block.value} />;
    case "hero_image_banner":
      return <HeroBanner value={block.value} />;
    case "accordion":
      return <Accordion value={block.value} />;
    // ... handle each block type
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}
```

````

- [ ] **Step 3: Create `hse-design-system/SKILL.md`**

This skill documents the HSE Ireland design system. Read the actual packages for accurate details.

Before writing this file, read these to verify component exports and SCSS tokens:
- `apps/hse-multisite-template/node_modules/@hseireland/hse-frontend-react/src/components/index.ts`
- `apps/hse-multisite-template/node_modules/@hseireland/hse-frontend/packages/core/settings/_colours.scss`
- `apps/hse-multisite-template/node_modules/@hseireland/hse-frontend/packages/core/settings/_spacing.scss`
- `apps/hse-multisite-template/node_modules/@hseireland/hse-frontend/packages/core/settings/_breakpoints.scss`

```markdown
---
name: HSE Design System
description: Component catalogue, SCSS tokens, and usage guide for @hseireland/hse-frontend and @hseireland/hse-frontend-react
---

# HSE Design System

The HSE Ireland design system provides CSS/SCSS tokens (`@hseireland/hse-frontend`) and React components (`@hseireland/hse-frontend-react`). **Always use these before building custom components.**

## Exploring Components

Use the **Storybook MCP** server at `http://localhost:6006/mcp` to explore component props, variants, and live examples interactively.

## HSE Policy

- **Do not customize** design system components or add inline CSS (HSE accessibility policy).
- Use semantic HTML elements over `<div>`/`<span>`.
- Content must target a reading age of 9 (plain English).
- Accessibility overlays/widgets are **prohibited**.

## Component Catalogue (`@hseireland/hse-frontend-react`)

### Layout
| Component | Import | Purpose |
|---|---|---|
| `Container` | `{ Container }` | Page-width wrapper. `fluid` prop for full-width. |
| `Row` | `{ Row }` | Grid row |
| `Col` | `{ Col }` | Grid column |

**Layout pattern:** `<Container>` → `<Row>` → `<Col>` for all grid layouts.

### Content Presentation
| Component | Purpose |
|---|---|
| `Hero` | Page hero banner. Composition: `<Hero><Hero.Heading>...<Hero.Text>...</Hero>`. Optional `imageSrc` prop. |
| `Callout` | Highlighted callout box |
| `CardList` | Card grid layout |
| `CareCard` | Urgent/non-urgent care information cards |
| `Details` | Expandable details/summary |
| `DoAndDontList` | Best practice lists |
| `BlockQuote` | Styled quotations |
| `Images` | Responsive image component |
| `InsetText` | Indented supplementary text |
| `ListItemPromo` | Promotional list items |
| `Listing` | Content listing layout |
| `Notification` | Status notifications (info, warning, success, error) |
| `Panel` | Bordered content panel |
| `SummaryList` | Key-value summary display |
| `Table` | Accessible data tables |
| `Video` | Video embed |
| `WarningCallout` | Important warning display |

### Navigation
| Component | Purpose |
|---|---|
| `Header` | Site header. Composition pattern with `HeaderLogo`, `HeaderMainMenu`, `HeaderSearch`, etc. Client component with `theme` prop (`'default'` or `'grey'`). |
| `Footer` | Site footer |
| `Breadcrumb` | Breadcrumb navigation |
| `SkipLink` | Accessibility skip-to-content link |
| `BackLink` | Back navigation link |
| `Pagination` | Page navigation |
| `PaginationTop` | Top pagination variant |
| `ContentsList` | Page contents sidebar |
| `ActionLink` | Call-to-action link |
| `DocumentLink` | Document download link |
| `LinksList` | Related links list |
| `ListPanel` | Grouped link panel |
| `PageContents` | Page section navigation |
| `Promo` | Promotional content card |
| `QuickLink` | Quick navigation link |
| `RelatedNav` | Related content navigation |
| `StepperNumber` | Step indicator |
| `HeaderDropdown` | Header dropdown menu |

### Form Elements
| Component | Purpose |
|---|---|
| `Button` | Polymorphic button/link. Modifiers: `'secondary'`, `'reverse'`, `'text'`. Auto-detects `<button>` vs `<a>` based on `href` prop. |
| `TextInput` | Single-line text input |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown select |
| `Checkboxes` | Checkbox group |
| `Radios` | Radio button group |
| `DateInput` | Date entry (day/month/year fields) |
| `FileUpload` | File upload input |
| `SearchWithButton` | Search input with submit button |
| `ErrorMessage` | Inline error message |
| `Fieldset` | Form field grouping |
| `Form` | Form wrapper |
| `HintText` | Input hint text |
| `Label` | Form label |
| `Legend` | Fieldset legend |

### Patterns
| Pattern | Purpose |
|---|---|
| `NavAZ` | A-Z alphabetical navigation |
| `PaginationListing` | Paginated content listing |
| `ReviewDate` | Content review date display |

## SCSS Tokens (`@hseireland/hse-frontend`)

### Colours

**Primary:**
- `$color_hse-green-500: #02a78b` (HSE brand green)
- `$color_hse-purple-700: #5f3dc4` (buttons primary)

**Semantic aliases:**
- `$hse-text-color`: `$color_hse-grey-900` (#212b32)
- `$hse-link-color`: `$color_hse-blue-500` (#0b55b7)
- `$hse-link-hover-color`: `$color_hse-blue-800` (#07336e)
- `$hse-link-visited-color`: `$color_hse-purple-700` (#5f3dc4)
- `$hse-focus-color`: `$color_hse-green-300` (#73e6c2)
- `$hse-border-color`: `$color_hse-grey-300` (#aeb7bd)
- `$hse-error-color`: `$color_hse-red-500` (#b30638)
- `$hse-button-color`: `$color_hse-purple-700` (#5f3dc4)

**Never hardcode colours** — always use the SCSS variables.

### Breakpoints

Uses `sass-mq`. Four breakpoints:
```scss
mobile:        320px
tablet:        641px
desktop:       769px
large-desktop: 990px
````

Usage: `@include mq($from: tablet) { ... }` or `@include mq($until: desktop) { ... }`

### Spacing

0-9 scale with responsive values:

```
0: 0px    1: 4px    2: 8px    3: 16px   4: 24px
5: 32px   6: 40px   7: 48px   8: 56px   9: 64px
```

Points 5-9 increase at tablet breakpoint. Use `hse-spacing()` function or `hse-responsive-margin`/`hse-responsive-padding` mixins.

### Typography

Font scale: 64, 48, 32, 24, 22, 19, 16, 14 (px, responsive mobile→tablet).

Weights: `$hse-font-normal: 400`, `$hse-font-bold: 600`.

### Key Mixins

| Mixin                            | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| `visually-hidden()`              | Hide visually, keep in DOM for screen readers |
| `visually-hidden-focusable()`    | Skip link pattern                             |
| `reading-width()`                | Max-width 44em for readable content           |
| `panel($bg, $text)`              | Panel component base                          |
| `care-card($bg, $text, $border)` | Care card component                           |
| `toggle-button()`                | Toggle button base                            |
| `close-button($size)`            | Close/dismiss button                          |

## Decision Guide

1. **Need a UI component?** Check this catalogue first. If it exists in `@hseireland/hse-frontend-react`, use it.
2. **Need to explore props/variants?** Use the Storybook MCP at `http://localhost:6006/mcp`.
3. **Need custom styling?** Use `@hseireland/hse-frontend` SCSS variables/tokens. Never hardcode colours, spacing, or breakpoints.
4. **Need a component that doesn't exist?** Compose from existing design system elements. Only create from scratch as a last resort.
5. **Layout?** Always use `Container` → `Row` → `Col`.

````

- [ ] **Step 4: Create `conventional-commit/SKILL.md`**

```markdown
---
name: Conventional Commits
description: Commit message format enforced by commitlint in this monorepo
---

# Conventional Commits

This monorepo enforces commit messages via `@repo/commitlint-config` (extends `@commitlint/config-conventional`).

## Format

````

type(scope): description

[optional body]

[optional footer]

```

## Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance (deps, config, tooling) |
| `docs` | Documentation changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `ci` | CI/CD changes |
| `style` | Code style (formatting, whitespace) |
| `perf` | Performance improvement |
| `build` | Build system changes |

## Scopes

Enforced scopes (from `.commitlintrc.js`):

| Scope | When to use |
|---|---|
| `apps` | Changes to any app in `apps/` |
| `packages` | Changes to any package in `packages/` |
| `configs` | Shared config changes |
| `gh-actions` | GitHub Actions / CI workflows |
| `deps` | Production dependency changes |
| `deps-dev` | Dev dependency changes |

Scope is optional — omit for cross-cutting changes.

## Examples

```

feat(apps): add news listing page with pagination
fix(packages): handle null breadcrumb in CMSClient response
chore(deps): update @hseireland/hse-frontend-react to 5.4.0
docs: add Copilot agentic setup instructions
ci(gh-actions): add Biome lint step to PR workflow
refactor(packages): extract Zod schema helpers to shared util

```

## Breaking Changes

Use `!` suffix or `BREAKING CHANGE:` footer:

```

feat(packages)!: rename fetchContent to fetchEndpoint

BREAKING CHANGE: fetchContent has been renamed to fetchEndpoint for clarity

```

## Rules

- Subject uses sentence case (not enforced strictly, but preferred).
- No period at end of subject line.
- Body wraps at 100 characters.
- Run `pnpm lint` before committing (Biome auto-fixes formatting issues).
```

- [ ] **Step 5: Commit skills**

```bash
git add .github/skills/
git commit -m "feat(gh-actions): add portable skills for CMS, design system, and commits"
```

---

## Task 2: Create Instruction Files

Four scoped instruction files that activate automatically based on file patterns.

**Files:**

- Create: `.github/instructions/typescript.instructions.md`
- Create: `.github/instructions/nextjs.instructions.md`
- Create: `.github/instructions/cms-packages.instructions.md`
- Create: `.github/instructions/a11y.instructions.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .github/instructions`

- [ ] **Step 2: Create `typescript.instructions.md`**

```markdown
---
description: "TypeScript conventions for this pnpm + Turborepo monorepo. Biome formatting, strict mode, workspace protocols."
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Conventions

- **Strict mode** everywhere. Never use `any` — use `unknown` and narrow, or define a proper type.
- **Biome v2** for linting and formatting (no ESLint). Tabs, indent-width 2, line-width 120.
- Run `pnpm lint` (Biome check --write) before committing.
- Prefer **named exports**. Use `type` keyword for type-only imports: `import type { Foo } from "..."`.

## Monorepo Dependencies

- Internal packages: `"workspace:*"` protocol in `package.json`.
- External versions: `"catalog:"` referencing `pnpm-workspace.yaml` catalog — never pin versions directly in `package.json`.

## Library Package Imports

- `@repo/wagtail-api-client` and `@repo/logger`: built with bunchee. TypeScript imports **must use `.js` extensions** (e.g., `import { foo } from "./lib/index.js"`).
- `@repo/wagtail-cms-types`: source-only — no build step, exports raw `.ts` files. Import via sub-path: `@repo/wagtail-cms-types/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
```

- [ ] **Step 3: Create `nextjs.instructions.md`**

````markdown
---
description: "Next.js 16 App Router conventions — Server Components, async params, Wagtail CMS integration, HSE design system."
applyTo: "apps/**"
---

# Next.js App Router Conventions

## IMPORTANT: Read the bundled docs first

**Before writing Next.js code, check `node_modules/next/dist/docs/01-app/` for current API documentation.** Training data may not reflect Next.js 16 changes. Also check `AGENTS.md` in the app root for version-specific deprecation warnings.

## Server vs Client Components

- **Server Components by default.** Only add `"use client"` when the component needs interactivity, hooks, browser APIs, or event handlers.
- No Node.js runtime APIs in edge/serverless functions.

## Breaking Change: Async Params (Next.js 16)

`params` and `searchParams` are now **async** — you must `await` them:

```typescript
// Correct (Next.js 16)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
}

// Wrong — will error
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // Error: params is a Promise
}
```
````

## CMS Integration

- Use `CMSClient` from `@repo/wagtail-api-client` for all CMS data fetching.
- Validate responses with Zod schemas from `@repo/wagtail-cms-types`.
- Fetch in Server Components — never in Client Components.

## UI Components

- Use `@hseireland/hse-frontend-react` components before building custom.
- Use `@hseireland/hse-frontend` SCSS tokens for any custom styling.
- Layout: `<Container>` → `<Row>` → `<Col>`.

## Conventions

- `next/image` for all images with `width`, `height`, `alt`.
- `next/font` for font loading at the layout level.
- `<Suspense>` boundaries and `loading.tsx` for streaming/loading states.
- `error.tsx` for error boundaries at route segments.
- Server Actions for form mutations, not API routes.

## Tooling

- **Biome** for linting (not ESLint). Run `pnpm lint`.
- **Vitest** for testing (not Jest). Run `turbo run test --filter=<app>`.

````

- [ ] **Step 4: Create `cms-packages.instructions.md`**

```markdown
---
description: "Conventions for Wagtail CMS packages — Zod schemas, sub-path exports, bunchee builds, CMSClient API."
applyTo: "packages/wagtail-*/**"
---

# CMS Package Conventions

## `@repo/wagtail-cms-types` (source-only)

- **No build step** — `exports` map points directly at `.ts` files.
- Sub-path exports: `/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
- All types use **Zod schemas** for runtime validation. Define schema first, infer type with `z.infer<>`.
- Block types use discriminated union on `type` field.
- `CMSBlockComponentsKeys` enum lists all valid block types.
- Page models extend `CMSPageWithBlocks` which provides `header: Block[]` and `body: Block[]`.

### Adding a new type

1. Create Zod schema in the appropriate sub-path directory.
2. Export schema and inferred type.
3. Add to the relevant union type (e.g., `CMSPageProps`, `BlockValuesProps`).
4. Update `CMSBlockComponentsKeys` or `CMSPageType` enum if adding a new block/page type.

## `@repo/wagtail-api-client` (built with bunchee)

- Dual output: ESM (`dist/es/`) + CJS (`dist/cjs/`).
- TypeScript imports **must use `.js` extensions**.
- `CMSClient` takes `ClientOptions: { baseURL, mediaBaseURL?, apiPath, init? }`.
- All fetches include ISR caching (`next: { revalidate: 360 }` default).

### CMSClient Methods

| Method | Returns |
|---|---|
| `fetchPage(idOrSlug, queries?, init?)` | Single page |
| `fetchPages(queries?, init?)` | Page listing |
| `findPageByPath<T>(path, init?)` | Page by URL path |
| `fetchPagePreview<T>(contentType, token, id, init?)` | Draft preview |
| `fetchImage(id, queries?, init?)` | Single image |
| `fetchDocument(id, queries?, init?)` | Single document |
| `getMediaSrc(media)` | Full media URL string |
````

- [ ] **Step 5: Create `a11y.instructions.md`**

```markdown
---
description: "Accessibility requirements — WCAG 2.1 AA legal minimum, HSE-specific policies, semantic HTML, keyboard navigation."
applyTo: "**/*.tsx"
---

# Accessibility Requirements

## Legal Obligation

**WCAG 2.1 AA is the legal minimum** — required by the EU/Irish Accessibility Directive. This is not optional for HSE public-sector services.

## Semantic HTML First

- Use `<header>`, `<footer>`, `<article>`, `<nav>`, `<main>`, `<section>`, `<aside>`.
- Never use `<div>` or `<span>` where a semantic element exists.
- ARIA attributes only when no native HTML equivalent exists.

## Keyboard & Focus

- Logical tab order. Visible focus indicators (`$hse-focus-color`).
- Skip links (use `<SkipLink>` from the design system).
- Focus management on route changes and modal open/close.

## Visual

- Colour contrast: meet AA ratio minimums (4.5:1 text, 3:1 large text/UI).
- Never rely on colour alone to convey meaning — pair with text/icons.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Images & Media

- Every `<img>` needs meaningful `alt` text, or `alt=""` if purely decorative.
- Video: captions and transcripts. Audio: transcripts.

## Forms

- Label every control with visible `<label>`.
- Inline error messages associated with controls.
- `autocomplete` attribute where applicable.
- Use `@hseireland/hse-frontend-react` form components — they handle a11y patterns correctly.

## HSE-Specific Policies

Source: [service-manual.hse.ie/accessibility](https://service-manual.hse.ie/accessibility)

- **Accessibility overlays/widgets are prohibited** (HSE policy, per EDF/IAAP 2023 joint statement).
- **Do not customize HSE Design System components** or add inline CSS.
- **Content must be plain English** targeting a reading age of 9.
- **Avoid PDFs** — publish as HTML webpages. If a PDF is unavoidable, it must be WCAG 2.1 compliant.
- **Mobile-first is mandatory** — ~74% of HSE website users are on mobile devices.

## Testing

- Automated: Axe DevTools, Lighthouse (Chrome extensions).
- Screen readers: NVDA (PC), VoiceOver (iOS/macOS), TalkBack (Android).
- Keyboard-only navigation testing on all interactive elements.
- Automated tests catch less than half of issues — manual testing is essential.
```

- [ ] **Step 6: Commit instructions**

```bash
git add .github/instructions/
git commit -m "feat(gh-actions): add scoped Copilot instructions for TS, Next.js, CMS, a11y"
```

---

## Task 3: Create Strict-Tone Agents (a11y-reviewer, security-reviewer)

These two agents use strict enforcement tone ("must fix", "violation").

**Files:**

- Create: `.github/agents/a11y-reviewer.agent.md`
- Create: `.github/agents/security-reviewer.agent.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .github/agents`

- [ ] **Step 2: Create `a11y-reviewer.agent.md`**

Adapted from `github/awesome-copilot/agents/accessibility.agent.md`. Strip Angular/Vue, add HSE policies, strict tone.

````markdown
---
name: "A11y Reviewer"
description: "Accessibility reviewer enforcing WCAG 2.1 AA and HSE-specific policies for public-sector health services"
tools: ["changes", "codebase", "edit/editFiles", "search", "openSimpleBrowser", "problems", "usages"]
---

# Accessibility Reviewer

You are an accessibility expert reviewing code for a **public-sector Irish health service**. WCAG 2.1 AA compliance is a **legal obligation** under the EU/Irish Accessibility Directive — not a nice-to-have.

**Tone: Strict.** Flag violations as "MUST FIX" with the relevant WCAG success criterion.

## Domain Knowledge

Refer to `.github/skills/hse-design-system/SKILL.md` for the component catalogue and design tokens. Use the Storybook MCP at `http://localhost:6006/mcp` to check component accessibility features.

## HSE-Specific Policies

Source: [service-manual.hse.ie/accessibility](https://service-manual.hse.ie/accessibility)

- **WCAG 2.1 AA minimum** — every page, every component.
- **Accessibility overlays/widgets are PROHIBITED** (HSE policy per EDF/IAAP 2023 statement). If you see one, flag it immediately.
- **Do not customize HSE Design System components** — `@hseireland/hse-frontend-react` components handle accessibility patterns. Customizing them risks breaking a11y.
- **No inline CSS** on design system components.
- **Plain English, reading age 9** — flag complex language.
- **Avoid PDFs** — HTML is the accessible format. Flag PDF generation without accessible alternatives.
- **Mobile-first** — 74% of users are on mobile. Flag desktop-only patterns.

## Review Checklist

### Semantics & Structure

- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Landmarks used: `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`
- [ ] No `<div>` or `<span>` where a semantic element exists
- [ ] Lists use `<ul>`/`<ol>`/`<li>`, not styled divs
- [ ] Tables have `<th>`, `scope`, and `<caption>` where appropriate

### Keyboard & Focus

- [ ] All interactive elements keyboard-accessible
- [ ] Visible focus indicator on all focusable elements
- [ ] Skip link present (use `<SkipLink>` component)
- [ ] Tab order is logical — matches visual order
- [ ] Focus managed on route changes, modal open/close
- [ ] No keyboard traps

### Images & Media

- [ ] All `<img>` have meaningful `alt` or `alt=""` if decorative
- [ ] Complex images have long description or adjacent text
- [ ] `next/image` used (not raw `<img>`)
- [ ] Videos have captions/transcripts

### Forms

- [ ] Every input has a visible `<label>`
- [ ] Error messages are inline, associated with the control
- [ ] `autocomplete` attributes on relevant fields
- [ ] Design system form components used (`@hseireland/hse-frontend-react`)

### Colour & Visual

- [ ] Text contrast ≥ 4.5:1 (AA), large text ≥ 3:1
- [ ] Non-text UI elements ≥ 3:1 contrast
- [ ] Colour is not the sole indicator of state/meaning
- [ ] `prefers-reduced-motion` respected
- [ ] Content reflows at 400% zoom without horizontal scroll

### Dynamic Content

- [ ] Live regions for async updates (`aria-live="polite"`)
- [ ] Route changes announced to screen readers
- [ ] Modal dialogs trap focus and restore on close

## Severity Levels

- **MUST FIX** — WCAG 2.1 AA violation. Legal non-compliance. Reference the success criterion (e.g., SC 1.1.1).
- **SHOULD FIX** — Best practice that improves usability but is not a strict AA violation.
- **CONSIDER** — Enhancement that would improve the experience (AAA level or beyond WCAG).

## Testing Commands

```bash
# Axe CLI
npx @axe-core/cli http://localhost:3000 --exit

# Pa11y
npx pa11y http://localhost:3000 --reporter cli

# Lighthouse accessibility audit
npx lhci autorun --only-categories=accessibility
```
````

## PR Review Comment Template

```
**A11y Review:**
- Semantics/roles/names: [OK / MUST FIX: ...]
- Keyboard & focus: [OK / MUST FIX: ...]
- Images & alt text: [OK / MUST FIX: ...]
- Forms & errors: [OK / MUST FIX: ...]
- Contrast/visual: [OK / MUST FIX: ...]
- Dynamic content: [OK / MUST FIX: ...]

Refs: WCAG 2.1 [SC x.x.x] as applicable
```

````

- [ ] **Step 3: Create `security-reviewer.agent.md`**

Adapted from `github/awesome-copilot/agents/se-security-reviewer.agent.md`. Focus on Next.js, CMS data, secrets.

```markdown
---
name: "Security Reviewer"
description: "Security-focused code reviewer for Next.js + Wagtail CMS — OWASP Top 10, secrets detection, CSP, data validation"
tools: ["codebase", "edit/editFiles", "search", "problems"]
---

# Security Reviewer

You review code for security vulnerabilities in a **Next.js 16 + Wagtail CMS** monorepo serving public health services. Prioritise preventing data exposure and injection attacks.

**Tone: Strict.** Flag risks as "SECURITY RISK" or "MUST NOT BE COMMITTED".

## Critical: Secrets Detection

**Flag immediately — MUST NOT BE COMMITTED:**
- API keys, tokens, credentials in source code
- `.env` file contents in code or config
- Hardcoded CMS backend URLs (must be environment variables)
- Private keys, certificates, or secrets in any file
- `console.log` of sensitive data (auth tokens, user PII)

Environment variables must be accessed via `process.env` and defined in `.env.local` (gitignored).

## OWASP Top 10 Focus Areas

### A01: Broken Access Control
- Server-side auth checks in middleware and Server Components
- No client-side-only auth gates — Client Components can be bypassed
- Verify `middleware.ts` protects sensitive routes

### A02: Cryptographic Failures
- HTTPS only for CMS API calls
- No sensitive data in URL parameters
- Secure cookie flags (httpOnly, secure, sameSite)

### A03: Injection
- **XSS via CMS content**: Flag `dangerouslySetInnerHTML` with CMS data — this is the primary injection vector. CMS content must be sanitized before rendering as HTML.
- **React auto-escapes JSX** — but only when content is rendered as text, not as HTML.
- Validate all CMS responses with Zod schemas (`@repo/wagtail-cms-types`) — this is the data validation boundary.

### A05: Security Misconfiguration
- CSP headers configured in `next.config.js` or middleware
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers set
- No `Access-Control-Allow-Origin: *` in production

### A07: Authentication Failures
- Session tokens not in localStorage (use httpOnly cookies)
- Rate limiting on auth endpoints
- Secure password/token handling

### A09: Logging & Monitoring
- No PII in logs
- No auth tokens in error messages or stack traces
- Use `@repo/logger` — never raw `console.log` for sensitive operations

## Next.js-Specific Checks

- [ ] `middleware.ts` at root for auth/redirect — not just client-side checks
- [ ] Server Actions validate input (Zod) — never trust client data
- [ ] Environment variables: `NEXT_PUBLIC_` prefix only for truly public values
- [ ] `next.config.js`: security headers configured
- [ ] No `eval()`, `Function()`, or dynamic code execution
- [ ] Image domains allowlisted in `next.config.js`

## CMS Data Validation

- [ ] All `CMSClient` responses validated through Zod schemas before rendering
- [ ] CMS API URL is an environment variable, not hardcoded
- [ ] Rich text from CMS sanitized before `dangerouslySetInnerHTML`
- [ ] File uploads from CMS validated for type and size

## Review Template

````

**Security Review:**

- Secrets/credentials: [CLEAN / SECURITY RISK: ...]
- Input validation: [OK / SECURITY RISK: ...]
- Auth/access control: [OK / SECURITY RISK: ...]
- CMS data handling: [OK / SECURITY RISK: ...]
- Headers/CSP: [OK / SECURITY RISK: ...]
- Dependencies: [OK / SECURITY RISK: ...]

```

```

- [ ] **Step 4: Commit strict-tone agents**

```bash
git add .github/agents/a11y-reviewer.agent.md .github/agents/security-reviewer.agent.md
git commit -m "feat(gh-actions): add a11y-reviewer and security-reviewer agents"
```

---

## Task 4: Create Collaborative-Tone Agents

Four agents with advisory tone ("prefer", "consider", "recommended").

**Files:**

- Create: `.github/agents/nextjs-developer.agent.md`
- Create: `.github/agents/react-expert.agent.md`
- Create: `.github/agents/gh-actions-expert.agent.md`
- Create: `.github/agents/cms-specialist.agent.md`

- [ ] **Step 1: Create `nextjs-developer.agent.md`**

Adapted from `github/awesome-copilot/agents/expert-nextjs-developer.agent.md`. Pinned to Next.js 16, CMS integration, Biome/Vitest.

````markdown
---
name: "Next.js Developer"
description: "Next.js 16 App Router expert for this Wagtail CMS monorepo — Server Components, data fetching, HSE design system"
tools:
  [
    "changes",
    "codebase",
    "edit/editFiles",
    "fetch",
    "findTestFiles",
    "new",
    "openSimpleBrowser",
    "problems",
    "runCommands",
    "runTests",
    "search",
    "searchResults",
    "terminalLastCommand",
    "terminalSelection",
    "testFailure",
    "usages",
  ]
---

# Next.js Developer

You are an expert Next.js 16 developer working in a pnpm + Turborepo monorepo that integrates with a Wagtail CMS backend using the HSE Ireland design system.

**Tone: Collaborative.** Use "prefer", "consider", "recommended".

## IMPORTANT: Check the docs first

**Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/01-app/`.** APIs and conventions may differ from your training data. Also check `apps/hse-multisite-template/AGENTS.md` for deprecation notices.

## Domain Knowledge

- CMS data flow: refer to `.github/skills/cms-content-fetching/SKILL.md`
- UI components: refer to `.github/skills/hse-design-system/SKILL.md`
- Use the Storybook MCP at `http://localhost:6006/mcp` to explore available components.

## Key Patterns

### Server Components (Default)

All components are Server Components unless marked with `"use client"`. Prefer Server Components for:

- Data fetching (CMSClient calls)
- Rendering CMS content
- Layout and page structure

Only add `"use client"` when you need interactivity, hooks, event handlers, or browser APIs.

### Async Params (Next.js 16 Breaking Change)

`params` and `searchParams` are **async** in Next.js 16:

```typescript
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // ...
}
```
````

### CMS Data Fetching

```typescript
import { CMSClient } from "@repo/wagtail-api-client";
import type { CMSPageProps } from "@repo/wagtail-cms-types/page-models";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL!,
  apiPath: process.env.CMS_API_PATH!,
});

// In a Server Component:
const page = await client.findPageByPath<CMSPageProps>(path);
```

### Streaming & Loading

Use `<Suspense>` boundaries and `loading.tsx` for perceived performance:

```typescript
import { Suspense } from "react";

export default function Layout({ children }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {children}
    </Suspense>
  );
}
```

## Tooling

| Tool       | Command                                            |
| ---------- | -------------------------------------------------- |
| Lint       | `pnpm lint` (Biome v2, not ESLint)                 |
| Test       | `turbo run test --filter=<app>` (Vitest, not Jest) |
| Typecheck  | `pnpm typecheck`                                   |
| Dev server | `turbo run dev --filter=<app>`                     |

## Monorepo Context

- Internal packages: `"workspace:*"` protocol
- External versions: `"catalog:"` from `pnpm-workspace.yaml`
- Filter to workspace: `turbo run <task> --filter=<package>`

````

- [ ] **Step 2: Create `react-expert.agent.md`**

Adapted from `github/awesome-copilot/agents/expert-react-frontend-engineer.agent.md`. React 19, HSE design system, block rendering.

```markdown
---
name: "React Expert"
description: "React 19 frontend expert — HSE design system, Server Components, react-hook-form, CMS block rendering patterns"
tools: ["changes", "codebase", "edit/editFiles", "fetch", "findTestFiles", "new", "problems", "runCommands", "runTests", "search", "searchResults", "testFailure", "usages"]
---

# React Expert

You are an expert React 19 frontend engineer working with the HSE Ireland design system and Wagtail CMS content.

**Tone: Collaborative.** Use "prefer", "consider", "recommended".

## Domain Knowledge

- Component catalogue: refer to `.github/skills/hse-design-system/SKILL.md`
- CMS block rendering: refer to `.github/skills/cms-content-fetching/SKILL.md`
- Use the Storybook MCP at `http://localhost:6006/mcp` to explore components interactively.

## Design System First

**Always check `@hseireland/hse-frontend-react` before building custom components.** The design system provides accessible, tested components for layout, navigation, forms, and content presentation.

Import: `import { Container, Row, Col, Button, Hero } from "@hseireland/hse-frontend-react";`

If you need custom styling, use `@hseireland/hse-frontend` SCSS tokens — never hardcode colours, spacing, or breakpoints.

## Key Patterns

### Server vs Client Components

- **Server Components by default** — for data fetching and rendering CMS content
- `"use client"` only for: event handlers, hooks (`useState`, `useEffect`, etc.), browser APIs
- Keep Client Components small and push them to the leaf nodes

### CMS Block Rendering

Pages contain `header: Block[]` and `body: Block[]`. Render by discriminating on `block.type`:

```typescript
import type { CMSBlockType } from "@repo/wagtail-cms-types/blocks";

function BlockRenderer({ block }: { block: CMSBlockType }) {
  switch (block.type) {
    case "hero_image_banner":
      return <HeroBanner value={block.value} />;
    case "text":
      return <TextBlock value={block.value} />;
    case "accordion":
      return <AccordionBlock value={block.value} />;
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}
````

### Forms

Use `react-hook-form` + `@hookform/resolvers` + Zod schemas:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });
  // Use design system form components for inputs
}
```

### Component Composition

Follow the design system's composition pattern:

```tsx
<Hero imageSrc="/hero.jpg">
  <Hero.Heading>Welcome</Hero.Heading>
  <Hero.Text>Supporting text</Hero.Text>
</Hero>
```

## Testing

- **Vitest** with `@vitest/coverage-v8` (not Jest)
- Default environment: `jsdom`
- Run: `turbo run test --filter=<package>`

````

- [ ] **Step 3: Create `gh-actions-expert.agent.md`**

Adapted from `github/awesome-copilot/agents/github-actions-expert.agent.md`. pnpm + Turborepo CI patterns.

```markdown
---
name: "GitHub Actions Expert"
description: "CI/CD specialist for this pnpm + Turborepo monorepo — workflow authoring, caching, security hardening"
tools: ["codebase", "edit/editFiles", "search", "runCommands", "terminalLastCommand"]
---

# GitHub Actions Expert

You are a GitHub Actions specialist helping build CI/CD workflows for a pnpm + Turborepo monorepo with Next.js apps and shared packages.

**Tone: Collaborative.** Use "prefer", "consider", "recommended".

## Monorepo CI Patterns

### Standard Steps

```yaml
- uses: actions/checkout@v4

- uses: pnpm/action-setup@v4
  # Version auto-detected from package.json packageManager field

- uses: actions/setup-node@v4
  with:
    node-version-file: ".node-version"
    cache: "pnpm"

- run: pnpm install --frozen-lockfile
````

### Turborepo Tasks

```yaml
- run: pnpm build # Build all packages in dependency order
- run: pnpm lint # Biome check --write
- run: pnpm typecheck # tsc --noEmit across workspace
- run: pnpm test:ci # Vitest with coverage
```

### Filtering to Changed Packages

```yaml
- run: turbo run test --filter=...[origin/main]
  # Only test packages affected by changes since main
```

### Turbo Remote Caching

Consider Turborepo remote caching for faster CI:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

## Security Best Practices

- **Pin actions to full SHA** — not tags: `uses: actions/checkout@<full-sha>`
- **Least privilege permissions** — set `permissions:` at workflow and job level
- **No secrets in logs** — use `::add-mask::` for dynamic secrets
- **Dependency review** — use `actions/dependency-review-action` on PRs
- **Commitlint** — enforce conventional commits:
  ```yaml
  - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD
  ```

## Caching

pnpm cache is handled by `setup-node`. For Turbo cache:

```yaml
- uses: actions/cache@v4
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: turbo-${{ runner.os }}-
```

## Dependency Management

- External versions pinned in `pnpm-workspace.yaml` catalog — `catalog:` in package.json
- HSE design system from GitHub Packages (`@hseireland` scope) — may need `NODE_AUTH_TOKEN` in CI
- Use `pnpm install --frozen-lockfile` — never `pnpm install` in CI

````

- [ ] **Step 4: Create `cms-specialist.agent.md`**

Custom agent — no upstream template. Wagtail CMS expert.

```markdown
---
name: "CMS Specialist"
description: "Wagtail headless CMS integration expert — content modelling, API client, Zod schemas, data flow"
tools: ["codebase", "edit/editFiles", "search", "fetch", "problems", "usages"]
---

# CMS Specialist

You are an expert in Wagtail headless CMS integration for this Next.js monorepo. You help with content modelling, API client usage, Zod schema design, and the full content fetching pipeline.

**Tone: Collaborative.** Use "prefer", "consider", "recommended".

## Domain Knowledge

Refer to `.github/skills/cms-content-fetching/SKILL.md` for the complete data flow, type reference, and code examples.

## Wagtail Pages API v2

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v2/pages/` | List pages with filtering |
| `GET /api/v2/pages/{id}/` | Single page detail |
| `GET /api/v2/pages/find/?html_path=/path/` | Resolve URL path to page (302 redirect) |
| `GET /api/v2/images/` | List images |
| `GET /api/v2/documents/` | List documents |

### Query Parameters

| Param | Example | Purpose |
|---|---|---|
| `type` | `?type=news.NewsContentPage` | Filter by page model (required for custom fields) |
| `fields` | `?fields=title,body,lead_text` | Select fields (`*` for all) |
| `child_of` | `?child_of=5` | Direct children |
| `descendant_of` | `?descendant_of=5` | All descendants |
| `ancestor_of` | `?ancestor_of=10` | All ancestors |
| `slug` | `?slug=about` | Exact slug match |
| `search` | `?search=mental+health` | Full-text search |
| `order` | `?order=-first_published_at` | Sort (prefix `-` for desc) |
| `locale` | `?locale=en` | Locale filter |
| `limit` / `offset` | `?limit=10&offset=20` | Pagination |

### Response Shape

```json
{
  "meta": { "total_count": 50 },
  "items": [{
    "id": 1,
    "meta": { "type": "...", "slug": "...", "html_url": "...", "first_published_at": "..." },
    "title": "..."
  }]
}
````

## Content Model

### Page Types

Six page types in `CMSPageType`:

- `appbase.HomePage`, `appbase.LandingPage`, `appbase.ContentPage`, `appbase.SearchPage`
- `news.NewsListingPage`, `news.NewsContentPage`

All extend `CMSPageWithBlocks` → `{ id, title, meta, breadcrumb?, header: Block[], body: Block[] }`.

`ContentPage` adds: `lead_text`, `disable_navigation`, `side_nav`.
`NewsContentPage` adds: `published_date`, `featured_image`, `lead_text`.

### Block Types

22 types in `CMSBlockComponentsKeys`: `content_block`, `alert`, `page_header`, `text`, `text_picture`, `picture`, `group`, `title_and_text`, `row`, `accordion`, `cta`, `cta_panel`, `card`, `text_and_icon`, `cover`, `quote`, `section_listing`, `hero_image_banner`, `youtube`, `team_member`, `timeline`, `demo_ui_banner`.

Each block: `{ id, type, value, settings?, client? }`.

### Settings

`CMSSiteSettingsItem` provides global config: header nav, footer columns, social links, Twitter/OG defaults, global alert banner, search config, 404 page, robots.txt, maintenance mode.

### Snippets

`SnippetContentBlock`: reusable content with `{ id, title, body: Block[] }`.

## CMSClient Usage

```typescript
import { CMSClient } from "@repo/wagtail-api-client";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL!,
  apiPath: process.env.CMS_API_PATH!,
});

// Fetch page by URL path (most common pattern)
const page = await client.findPageByPath("/services/mental-health");

// Fetch pages with filtering
const news = await client.fetchPages({
  type: "news.NewsContentPage",
  order: "-first_published_at",
  limit: 10,
});

// Fetch single page by ID
const home = await client.fetchPage(1);
```

## Zod Schema Conventions

- Define schema first, infer type: `type MyPage = z.infer<typeof MyPageSchema>`
- Extend `CMSPageWithBlocksSchema` for new page types
- Add block keys to `CMSBlockComponentsKeysSchema` enum
- Add to union types: `CMSPageProps`, `BlockValuesProps`
- Use sub-path exports for organization

````

- [ ] **Step 5: Commit collaborative-tone agents**

```bash
git add .github/agents/nextjs-developer.agent.md .github/agents/react-expert.agent.md .github/agents/gh-actions-expert.agent.md .github/agents/cms-specialist.agent.md
git commit -m "feat(gh-actions): add nextjs-developer, react-expert, gh-actions-expert, cms-specialist agents"
````

---

## Task 5: Create CMS Workflow Prompts

Four prompts for cross-package CMS workflows.

**Files:**

- Create: `.github/prompts/new-page-model.prompt.md`
- Create: `.github/prompts/new-streamfield-block.prompt.md`
- Create: `.github/prompts/new-page-with-blocks.prompt.md`
- Create: `.github/prompts/integrate-component.prompt.md`

- [ ] **Step 1: Create directory**

Run: `mkdir -p .github/prompts`

- [ ] **Step 2: Create `new-page-model.prompt.md`**

````markdown
---
name: "New Page Model"
description: "Add a new Wagtail page type: Zod schema in types, Next.js route in the app"
mode: "agent"
---

# New Page Model

Add a new Wagtail CMS page type to the monorepo.

## Variables

- `PAGE_TYPE_NAME`: The page type name as it appears in Wagtail (e.g., `ServicePage`)
- `APP_LABEL`: The Wagtail app label (e.g., `services`)
- `CUSTOM_FIELDS`: Any fields beyond the base `CMSPageWithBlocks` (e.g., `lead_text`, `featured_image`)

## Step 1: Add to CMSPageType enum

**File:** `packages/wagtail-cms-types/src/types/core/index.ts`

Add the new page type string to `CMSPageTypeSchema`:

```typescript
export const CMSPageTypeSchema = z.enum([
  // ... existing types
  "{APP_LABEL}.{PAGE_TYPE_NAME}",
]);
```
````

## Step 2: Create Zod schema

**File:** `packages/wagtail-cms-types/src/types/page-models/{app_label}.ts`

Create or update the file for this app label:

```typescript
import { z } from "zod";
import { CMSPageWithBlocksSchema } from "./index";
// Import field types as needed from "../fields"

export const CMS{AppLabel}{PageTypeName}PropsSchema = CMSPageWithBlocksSchema.extend({
  // Add custom fields here based on CUSTOM_FIELDS
});

export type CMS{AppLabel}{PageTypeName}Props = z.infer<
  typeof CMS{AppLabel}{PageTypeName}PropsSchema
>;
```

## Step 3: Add to CMSPageProps union

**File:** `packages/wagtail-cms-types/src/types/page-models/index.ts`

Import the new type and add to the union:

```typescript
export type CMSPageProps =
  | /* existing types */
  | import("./{app_label}").CMS{AppLabel}{PageTypeName}Props;
```

## Step 4: Create Next.js route

**File:** `apps/hse-multisite-template/src/app/{route-path}/page.tsx`

Create a Server Component that fetches and renders the page:

```typescript
import { CMSClient } from "@repo/wagtail-api-client";
import type { CMS{AppLabel}{PageTypeName}Props } from "@repo/wagtail-cms-types/page-models";

const client = new CMSClient({
  baseURL: process.env.CMS_BASE_URL!,
  apiPath: process.env.CMS_API_PATH!,
});

export default async function {PageTypeName}Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await client.findPageByPath<CMS{AppLabel}{PageTypeName}Props>(`/{route-path}/${slug}`);

  if ("error" in page) return notFound();

  return (
    // Render page content using design system components
    // Render page.body blocks using a BlockRenderer
  );
}
```

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, add a step here to register the page type to a layout template mapping -->

````

- [ ] **Step 3: Create `new-streamfield-block.prompt.md`**

```markdown
---
name: "New StreamField Block"
description: "Add a new Wagtail StreamField block type: Zod schema and enum registration"
mode: "agent"
---

# New StreamField Block

Add a new Wagtail StreamField block type to the CMS types package.

## Variables

- `BLOCK_KEY`: The block type key as it appears in the Wagtail API (e.g., `info_card`)
- `BLOCK_FIELDS`: The fields in the block's `value` object

## Step 1: Add to CMSBlockComponentsKeys enum

**File:** `packages/wagtail-cms-types/src/types/blocks/base.ts`

Add the new block key to `CMSBlockComponentsKeysSchema`:

```typescript
export const CMSBlockComponentsKeysSchema = z.enum([
  // ... existing keys
  "{BLOCK_KEY}",
]);
````

## Step 2: Create Zod schema for block value

**File:** `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`

```typescript
import { z } from "zod";
// Import field types as needed from "../fields"

export const Block{BlockName}ValuesPropsSchema = z.object({
  // Define the block's value fields based on BLOCK_FIELDS
});

export type Block{BlockName}ValuesProps = z.infer<
  typeof Block{BlockName}ValuesPropsSchema
>;
```

## Step 3: Add to BlockValuesProps union

**File:** `packages/wagtail-cms-types/src/types/blocks/index.ts`

Import the new type and add to the union:

```typescript
export type BlockValuesProps =
  | /* existing types */
  | import("./{block_key}").Block{BlockName}ValuesProps;
```

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, add a step here to map this block key to an @hseireland/hse-frontend-react component -->

````

- [ ] **Step 4: Create `new-page-with-blocks.prompt.md`**

```markdown
---
name: "New Page With Blocks"
description: "Add a new Wagtail page model that includes new StreamField block types"
mode: "agent"
---

# New Page Model With New Block Types

Combines the New StreamField Block and New Page Model workflows — creates new block types first, then a page model that uses them.

## Variables

- `PAGE_TYPE_NAME`: The page type name (e.g., `ServicePage`)
- `APP_LABEL`: The Wagtail app label (e.g., `services`)
- `CUSTOM_FIELDS`: Page-level fields beyond `CMSPageWithBlocks`
- `NEW_BLOCKS`: List of new block types to create, each with `BLOCK_KEY` and `BLOCK_FIELDS`

## Phase 1: Create Block Types

For each block in `NEW_BLOCKS`, follow the **New StreamField Block** workflow:

1. Add block key to `CMSBlockComponentsKeysSchema` in `packages/wagtail-cms-types/src/types/blocks/base.ts`
2. Create Zod schema in `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`
3. Add to `BlockValuesProps` union in `packages/wagtail-cms-types/src/types/blocks/index.ts`

## Phase 2: Create Page Model

Follow the **New Page Model** workflow:

1. Add page type to `CMSPageTypeSchema` in `packages/wagtail-cms-types/src/types/core/index.ts`
2. Create page schema in `packages/wagtail-cms-types/src/types/page-models/{app_label}.ts`
3. Add to `CMSPageProps` union in `packages/wagtail-cms-types/src/types/page-models/index.ts`
4. Create Next.js route in `apps/hse-multisite-template/src/app/`

## Phase 3: Wire Up Blocks to Page Rendering

In the page's route component, add the new block types to the block renderer:

```typescript
function BlockRenderer({ block }: { block: CMSBlockType }) {
  switch (block.type) {
    // ... existing cases
    case "{BLOCK_KEY}":
      return <{BlockComponent} value={block.value} />;
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}
````

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, block-to-component mapping and page-to-template mapping will be handled in that package instead of inline in the route component -->

````

- [ ] **Step 5: Create `integrate-component.prompt.md`**

```markdown
---
name: "Integrate Component"
description: "Wire up an existing @hseireland/hse-frontend-react component to a CMS block type"
mode: "agent"
---

# Integrate Design System Component

Wire up an existing `@hseireland/hse-frontend-react` component to a Wagtail CMS block type.

## Variables

- `COMPONENT_NAME`: The design system component to wire up (e.g., `Hero`, `Callout`, `Notification`)
- `BLOCK_KEY`: The CMS block key that maps to this component (e.g., `hero_image_banner`)

## Step 1: Explore the component

Use the **Storybook MCP** at `http://localhost:6006/mcp` to examine the component's props, variants, and usage examples.

Alternatively, read the component source:
`apps/hse-multisite-template/node_modules/@hseireland/hse-frontend-react/src/components/`

## Step 2: Check if block key exists

**File:** `packages/wagtail-cms-types/src/types/blocks/base.ts`

Check if `BLOCK_KEY` already exists in `CMSBlockComponentsKeysSchema`. If not, add it:

```typescript
export const CMSBlockComponentsKeysSchema = z.enum([
  // ... existing keys
  "{BLOCK_KEY}",
]);
````

## Step 3: Create or update Zod block schema

**File:** `packages/wagtail-cms-types/src/types/blocks/{block_key}.ts`

Create a Zod schema whose `value` fields match the CMS API response AND can be mapped to the component's props:

```typescript
import { z } from "zod";

export const Block{BlockName}ValuesPropsSchema = z.object({
  // Map CMS fields to match component props
  // Check Storybook for required vs optional props
});

export type Block{BlockName}ValuesProps = z.infer<
  typeof Block{BlockName}ValuesPropsSchema
>;
```

## Step 4: Add to BlockValuesProps union (if new)

**File:** `packages/wagtail-cms-types/src/types/blocks/index.ts`

If this is a new block type, add to the union:

```typescript
export type BlockValuesProps =
  | /* existing types */
  | import("./{block_key}").Block{BlockName}ValuesProps;
```

<!-- TODO: wagtail-cms-mapping — when @repo/wagtail-cms-mapping exists, add a step here to register the mapping from BLOCK_KEY to COMPONENT_NAME in the mapping package -->

````

- [ ] **Step 6: Commit CMS workflow prompts**

```bash
git add .github/prompts/new-page-model.prompt.md .github/prompts/new-streamfield-block.prompt.md .github/prompts/new-page-with-blocks.prompt.md .github/prompts/integrate-component.prompt.md
git commit -m "feat(gh-actions): add CMS workflow prompts for page models, blocks, and component integration"
````

---

## Task 6: Create Component & App Prompts

Three prompts for component creation and app scaffolding.

**Files:**

- Create: `.github/prompts/new-local-component.prompt.md`
- Create: `.github/prompts/new-custom-component.prompt.md`
- Create: `.github/prompts/new-app.prompt.md`

- [ ] **Step 1: Create `new-local-component.prompt.md`**

````markdown
---
name: "New Local Component"
description: "Create a custom composite component in the app, built from design system elements, with tests"
mode: "agent"
---

# New Local Component

Create a custom composite component local to the app, composed from `@hseireland/hse-frontend-react` elements.

## Variables

- `COMPONENT_NAME`: PascalCase component name (e.g., `ServiceCard`)
- `PURPOSE`: What the component does

## Step 1: Check the design system first

Before creating a custom component, verify it doesn't already exist:

1. Check the component catalogue in `.github/skills/hse-design-system/SKILL.md`
2. Use the Storybook MCP at `http://localhost:6006/mcp` to search for similar components
3. Only proceed if no existing component serves the purpose

## Step 2: Create the component

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/{ComponentName}.tsx`

```typescript
import { Container, Row, Col } from "@hseireland/hse-frontend-react";
// Import other design system components as needed

export interface {ComponentName}Props {
  // Define props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // Compose from design system elements
    // Use SCSS tokens from @hseireland/hse-frontend for any custom styling
    // Do NOT add inline CSS or customize design system components
  );
}
```
````

If the component needs interactivity, add `"use client"` directive at the top.

## Step 3: Create test file

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/{ComponentName}.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { {ComponentName} } from "./{ComponentName}";

describe("{ComponentName}", () => {
  it("renders correctly", () => {
    render(<{ComponentName} /* required props */ />);
    // Test key elements are present
  });
});
```

Run: `cd apps/hse-multisite-template && pnpm vitest run src/components/{ComponentName}/{ComponentName}.test.tsx`

## Step 4: Export from index

**File:** `apps/hse-multisite-template/src/components/{ComponentName}/index.ts`

```typescript
export { {ComponentName} } from "./{ComponentName}";
export type { {ComponentName}Props } from "./{ComponentName}";
```

````

- [ ] **Step 2: Create `new-custom-component.prompt.md`**

```markdown
---
name: "New Custom Component"
description: "Create a net-new component in @repo/hse-custom-ui using design system SCSS tokens"
mode: "agent"
---

# New Custom Component

Create a net-new component that doesn't exist in the HSE design system, using `@hseireland/hse-frontend` SCSS tokens for visual consistency.

> **Note:** The `@repo/hse-custom-ui` package does not exist yet. You may need to scaffold it first.

## Variables

- `COMPONENT_NAME`: PascalCase component name
- `PURPOSE`: What the component does

## Step 1: Check it doesn't exist

1. Search `.github/skills/hse-design-system/SKILL.md` for existing components
2. Check Storybook MCP at `http://localhost:6006/mcp`
3. Only create a custom component if nothing in the design system serves the purpose

## Step 2: Ensure package exists

**Directory:** `packages/hse-custom-ui/`

If the package doesn't exist, scaffold it:

```bash
mkdir -p packages/hse-custom-ui/src
````

Create `packages/hse-custom-ui/package.json`:

```json
{
  "name": "@repo/hse-custom-ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@hseireland/hse-frontend": "catalog:",
    "@hseireland/hse-frontend-react": "catalog:",
    "react": "catalog:"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*"
  }
}
```

Add to `pnpm-workspace.yaml` packages list if not already there.

## Step 3: Create the component

**File:** `packages/hse-custom-ui/src/{ComponentName}/{ComponentName}.tsx`

```typescript
// Import SCSS tokens from @hseireland/hse-frontend for visual consistency
// Import design system elements from @hseireland/hse-frontend-react to compose from
// Never hardcode colours, spacing, or breakpoints

export interface {ComponentName}Props {
  // Define props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // Build the component using design system foundations
  );
}
```

## Step 4: Create test file

**File:** `packages/hse-custom-ui/src/{ComponentName}/{ComponentName}.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { {ComponentName} } from "./{ComponentName}";

describe("{ComponentName}", () => {
  it("renders correctly", () => {
    render(<{ComponentName} /* required props */ />);
    // Assert key elements
  });
});
```

## Step 5: Export from package

**File:** `packages/hse-custom-ui/src/index.ts`

```typescript
export { {ComponentName} } from "./{ComponentName}/{ComponentName}";
export type { {ComponentName}Props } from "./{ComponentName}/{ComponentName}";
```

````

- [ ] **Step 3: Create `new-app.prompt.md`**

```markdown
---
name: "New App"
description: "Scaffold a new Next.js app in the monorepo using the cookiecutter Makefile"
mode: "agent"
---

# New App

Scaffold a new Next.js app in this monorepo.

## Variables

- `APP_NAME`: kebab-case app name (e.g., `hse-mental-health`)

## Step 1: Run the cookiecutter

From the repo root:

```bash
make new-app APP_NAME={APP_NAME}
````

If no Makefile target exists yet, manually scaffold based on `apps/hse-multisite-template/`.

## Step 2: Register in workspace

**File:** `pnpm-workspace.yaml`

Ensure `apps/{APP_NAME}` is included in the packages list (usually covered by `apps/*` glob).

## Step 3: Configure Turbo pipeline

**File:** `turbo.json`

The new app should inherit the default pipeline tasks (`build`, `dev`, `test`, `lint`, `typecheck`). No changes needed unless the app has custom tasks.

## Step 4: Set up shared configs

Ensure the new app uses:

- `@repo/typescript-config/nextjs.json` for tsconfig
- `@repo/biome-config` for Biome
- `@repo/vitest-config` for Vitest (`createVitestConfig()`)

## Step 5: Install dependencies

```bash
pnpm install
```

## Step 6: Verify

```bash
turbo run build --filter={APP_NAME}
turbo run dev --filter={APP_NAME}
```

````

- [ ] **Step 4: Commit component & app prompts**

```bash
git add .github/prompts/new-local-component.prompt.md .github/prompts/new-custom-component.prompt.md .github/prompts/new-app.prompt.md
git commit -m "feat(gh-actions): add component and app scaffolding prompts"
````

---

## Task 7: Update `copilot-instructions.md`

Add references to the new instructions, agents, and skills.

**Files:**

- Modify: `.github/copilot-instructions.md`

- [ ] **Step 1: Read the current file**

Read `.github/copilot-instructions.md` to see current content.

- [ ] **Step 2: Append references**

Add to the end of `.github/copilot-instructions.md`:

```markdown
## Scoped Instructions

Additional instructions activate based on file patterns — see `.github/instructions/`.

## Agents

Specialized agents are available in `.github/agents/`. Invoke them by name in Copilot chat (e.g., `@a11y-reviewer`, `@cms-specialist`).

## Skills

Portable skills in `.github/skills/` teach domain-specific workflows (CMS content fetching, HSE design system, conventional commits).
```

- [ ] **Step 3: Commit**

```bash
git add .github/copilot-instructions.md
git commit -m "docs(gh-actions): add references to agents, instructions, and skills in copilot-instructions"
```

---

## Task 8: Verify Complete Setup

Run a final check to ensure all files exist and the structure matches the spec.

**Files:** None created — verification only.

- [ ] **Step 1: Verify file count**

Run: `find .github/agents .github/instructions .github/prompts .github/skills -type f | wc -l`

Expected: 20 files (6 agents + 4 instructions + 7 prompts + 3 skills)

- [ ] **Step 2: Verify file structure**

Run: `find .github -type f -name "*.md" | sort`

Expected output:

```
.github/agents/a11y-reviewer.agent.md
.github/agents/cms-specialist.agent.md
.github/agents/gh-actions-expert.agent.md
.github/agents/nextjs-developer.agent.md
.github/agents/react-expert.agent.md
.github/agents/security-reviewer.agent.md
.github/copilot-instructions.md
.github/instructions/a11y.instructions.md
.github/instructions/cms-packages.instructions.md
.github/instructions/nextjs.instructions.md
.github/instructions/typescript.instructions.md
.github/prompts/integrate-component.prompt.md
.github/prompts/new-app.prompt.md
.github/prompts/new-custom-component.prompt.md
.github/prompts/new-local-component.prompt.md
.github/prompts/new-page-model.prompt.md
.github/prompts/new-page-with-blocks.prompt.md
.github/prompts/new-streamfield-block.prompt.md
.github/skills/cms-content-fetching/SKILL.md
.github/skills/conventional-commit/SKILL.md
.github/skills/hse-design-system/SKILL.md
```

- [ ] **Step 3: Verify YAML frontmatter**

Spot-check a few files to ensure frontmatter is valid:

```bash
head -5 .github/agents/a11y-reviewer.agent.md
head -5 .github/instructions/typescript.instructions.md
head -5 .github/prompts/new-page-model.prompt.md
head -5 .github/skills/cms-content-fetching/SKILL.md
```

Each should start with `---` and have the required frontmatter fields.

- [ ] **Step 4: Verify cross-references**

Check that agents reference skills correctly:

```bash
grep -l "cms-content-fetching/SKILL.md" .github/agents/*.md
```

Expected: `cms-specialist.agent.md`, `nextjs-developer.agent.md`, `react-expert.agent.md`

```bash
grep -l "hse-design-system/SKILL.md" .github/agents/*.md
```

Expected: `a11y-reviewer.agent.md`, `nextjs-developer.agent.md`, `react-expert.agent.md`
