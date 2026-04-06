# Copilot Agentic Development Setup — Design Spec

**Date**: 2026-04-06
**Status**: Draft
**Source**: `docs/copilot-agentic-setup.md`

---

## Overview

Create the full GitHub Copilot agentic development setup for this monorepo. This provides agents, scoped instructions, workflow prompts, and portable skills so every developer gets a consistent AI-assisted workflow — whether using Copilot, Claude Code, or other tools.

## Scope

- **1 file updated**: `.github/copilot-instructions.md` (minor additions)
- **4 instruction files** created in `.github/instructions/`
- **6 agent files** created in `.github/agents/`
- **7 prompt files** created in `.github/prompts/`
- **3 skill files** created in `.github/skills/`
- **Total: 21 files**

No changes to `.vscode/mcp.json` (already configured with context7, Playwright, Storybook).

---

## File Structure

```
.github/
  copilot-instructions.md              # UPDATE — add references to instructions/ and agents/
  instructions/
    typescript.instructions.md         # applyTo: "**/*.ts,**/*.tsx"
    nextjs.instructions.md             # applyTo: "apps/**"
    cms-packages.instructions.md       # applyTo: "packages/wagtail-*/**"
    a11y.instructions.md               # applyTo: "**/*.tsx"
  agents/
    a11y-reviewer.agent.md
    nextjs-developer.agent.md
    react-expert.agent.md
    gh-actions-expert.agent.md
    security-reviewer.agent.md
    cms-specialist.agent.md
  prompts/
    new-page-model.prompt.md
    new-streamfield-block.prompt.md
    new-page-with-blocks.prompt.md
    integrate-component.prompt.md
    new-local-component.prompt.md
    new-custom-component.prompt.md
    new-app.prompt.md
  skills/
    cms-content-fetching/SKILL.md
    hse-design-system/SKILL.md
    conventional-commit/SKILL.md
```

---

## 1. Instructions

Scoped instruction files that activate automatically based on file patterns. These shape every Copilot response when editing matching files — they must be concise and directive.

### 1.1 `typescript.instructions.md`

**Scope**: `applyTo: "**/*.ts,**/*.tsx"`

Content:
- TypeScript strict mode everywhere. No `any`.
- Biome v2 formatting: tabs, indent-width 2, line-width 120. No ESLint.
- Run `pnpm lint` (Biome check --write) before committing.
- Internal packages use `"workspace:*"` protocol.
- External versions use `"catalog:"` referencing `pnpm-workspace.yaml` catalog.
- Library packages (`@repo/wagtail-api-client`, `@repo/logger`): imports use `.js` extensions.
- `@repo/wagtail-cms-types` is source-only — no build step, exports raw `.ts`.
- Prefer named exports. Use `type` keyword for type-only imports.

### 1.2 `nextjs.instructions.md`

**Scope**: `applyTo: "apps/**"`

Content:
- Server Components by default. Add `"use client"` only for interactivity, hooks, or browser APIs.
- **Breaking change in Next.js 16**: `params` and `searchParams` are async — must `await` them.
- No Node.js runtime APIs in edge/serverless functions.
- Use `next/image` for all images with proper `width`, `height`, `alt`.
- Use `next/font` for font loading at the layout level.
- Streaming with `<Suspense>` boundaries and `loading.tsx` for loading states.
- `error.tsx` for error boundaries at route segments.
- Server Actions for form mutations, not API routes.
- **Reference `node_modules/next/dist/docs/01-app/` for current Next.js API documentation** — training data may be outdated.
- Consult `apps/hse-app-template/AGENTS.md` for version-specific warnings.

### 1.3 `cms-packages.instructions.md`

**Scope**: `applyTo: "packages/wagtail-*/**"`

Content:
- All CMS response shapes use Zod schemas for runtime validation and type inference.
- `@repo/wagtail-cms-types` sub-path exports: `/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
- Types package is source-only — `exports` map points at `.ts` files directly. No build step.
- Client package (`@repo/wagtail-api-client`) builds with bunchee to dual ESM + CJS output.
- TypeScript imports in client use `.js` extensions.
- `CMSClient` methods: `fetchPage`, `fetchPages`, `fetchContent`, `fetchImage`, `fetchDocument`, `findPageByPath`, `fetchPagePreview`, `getMediaSrc`.
- `CMSClient` takes `ClientOptions`: `{ baseURL, mediaBaseURL?, apiPath, init? }`.
- Block types use discriminated union on `type` field — `CMSBlockComponentsKeys` enum lists all 22 block types.
- Page models extend `CMSPageWithBlocks` with `header: Block[]` and `body: Block[]`.

### 1.4 `a11y.instructions.md`

**Scope**: `applyTo: "**/*.tsx"`

Content:
- **WCAG 2.1 AA is the legal minimum** — required by the EU/Irish Accessibility Directive.
- Semantic HTML first: `<header>`, `<footer>`, `<article>`, `<nav>`, `<main>`. Never use `<div>`/`<span>` where a semantic element exists.
- ARIA only when no native HTML equivalent exists.
- Keyboard navigable: logical tab order, visible focus indicators, skip links.
- Colour contrast: meet AA ratio minimums for text and non-text elements.
- **HSE-specific policies** (from service-manual.hse.ie/accessibility):
  - Accessibility overlays/widgets are **prohibited** (HSE policy per EDF/IAAP 2023 statement).
  - Do not customize HSE Design System components or add inline CSS.
  - Content must be plain English targeting a reading age of 9.
  - Avoid PDFs — publish as HTML. If PDF is unavoidable, it must be WCAG 2.1 compliant.
  - ~74% of HSE website users are on mobile — mobile-first is mandatory.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Every `<img>` needs meaningful `alt` text or `alt=""` if decorative.
- Forms: label every control, inline error messages, `autocomplete` where applicable.

---

## 2. Agents

Six agents with role-specific expertise. Each uses YAML frontmatter with `name`, `description`, and `tools`.

**Thin wrapper pattern**: Agents define persona, tone, and review checklists — then reference skills for domain knowledge. This keeps knowledge in one place (skills) that both Copilot and Claude can read.

### Tone policy
- **Strict** (a11y-reviewer, security-reviewer): "must fix", "violation", "security risk"
- **Collaborative** (all others): "prefer", "consider", "recommended"

### 2.1 `a11y-reviewer.agent.md`

**Adapted from**: `awesome-copilot/agents/accessibility.agent.md`
**References skills**: `hse-design-system/SKILL.md` (component a11y baseline)

**Customizations**:
- Strip Angular/Vue framework examples — React 19 only.
- Add HSE-specific legal requirements (WCAG 2.1 AA, Irish Accessibility Directive).
- Add HSE policies: no overlays, no design system customization, plain English reading age 9, no PDFs, semantic HTML.
- Reference `hse-design-system` skill for component baseline — flag when custom components lack a11y that design system provides for free.
- Reference Storybook MCP (`http://localhost:6006/mcp`) for checking component accessibility.
- Testing tools: Axe DevTools, Lighthouse, NVDA, VoiceOver, TalkBack.
- Quarterly audit cadence noted.
- Mobile-first: 74% mobile users.
- Strict tone: "WCAG violation", "must fix", reference specific success criteria (e.g., SC 1.1.1).
- Include PR review checklist template adapted for HSE context.

### 2.2 `nextjs-developer.agent.md`

**Adapted from**: `awesome-copilot/agents/expert-nextjs-developer.agent.md`
**References skills**: `cms-content-fetching/SKILL.md` (CMS data flow), `hse-design-system/SKILL.md` (UI components)

**Customizations**:
- Pin to Next.js 16 / React 19 App Router.
- **Add instruction to read `node_modules/next/dist/docs/01-app/`** before writing code — APIs may differ from training data.
- Reference `apps/hse-app-template/AGENTS.md` deprecation warnings.
- Add Wagtail CMS integration patterns: `CMSClient` usage in Server Components, data fetching with `fetchPage`/`findPageByPath`, Zod validation of responses.
- Add `@repo/wagtail-cms-types` typed response patterns.
- Replace ESLint/Jest references with Biome/Vitest.
- Add `@hseireland/hse-frontend-react` for UI components, `@hseireland/hse-frontend` for CSS/tokens.
- Add monorepo context: `workspace:*` protocol, Turborepo, package filtering.
- Collaborative tone.

### 2.3 `react-expert.agent.md`

**Adapted from**: `awesome-copilot/agents/expert-react-frontend-engineer.agent.md`
**References skills**: `hse-design-system/SKILL.md` (component catalogue), `cms-content-fetching/SKILL.md` (block rendering)

**Customizations**:
- Focus on React 19 patterns used in this project: Server Components, hooks, `react-hook-form` + Zod.
- Add HSE design system component usage guidance — always check `@hseireland/hse-frontend-react` before building custom.
- Reference Storybook MCP for component exploration.
- Add block rendering patterns: discriminated union on `block.type`, mapping to React components.
- Collaborative tone.

### 2.4 `gh-actions-expert.agent.md`

**Adapted from**: `awesome-copilot/agents/github-actions-expert.agent.md`

**Customizations**:
- Add pnpm + Turborepo monorepo CI patterns (install with `--frozen-lockfile`, turbo remote caching).
- Reference `pnpm-workspace.yaml` catalog for dependency management.
- Add workspace filtering: `turbo run test --filter=<package>`.
- Add Biome lint step, Vitest test step, `tsc --noEmit` typecheck step.
- Add commitlint check step.
- Collaborative tone.

### 2.5 `security-reviewer.agent.md`

**Adapted from**: `awesome-copilot/agents/se-security-reviewer.agent.md`

**Customizations**:
- Focus on Next.js-specific security: CSP headers, middleware auth patterns, environment variable handling.
- CMS data validation: Zod schemas as security boundary — all external CMS data must be validated.
- **Strict about secrets**: flag any API keys, tokens, credentials, `.env` values in code. Must never be committed.
- Flag hardcoded URLs, especially CMS backend URLs that should be environment variables.
- OWASP Top 10 relevant to this stack: XSS (React mitigates but `dangerouslySetInnerHTML` is a risk), injection via CMS content, broken access control.
- Strict tone: "security risk", "must not be committed".

### 2.6 `cms-specialist.agent.md`

**Custom agent** — no upstream template.
**References skills**: `cms-content-fetching/SKILL.md` (primary knowledge source)

**Content**:
- Wagtail headless CMS integration expert.
- **Wagtail Pages API v2 knowledge**:
  - Endpoints: `/api/v2/pages/`, `/api/v2/images/`, `/api/v2/documents/`
  - Query params: `?type=app_label.ModelName`, `?fields=`, `?child_of=`, `?descendant_of=`, `?ancestor_of=`, `?slug=`, `?search=`, `?order=`, `?locale=`, `?limit=`, `?offset=`
  - Path resolution: `GET /api/v2/pages/find/?html_path=/about/` (returns 302 redirect)
  - Field selection: `?fields=field1,field2`, `?fields=*`, nested with parentheses
  - Pagination: `meta.total_count` + `limit`/`offset`
- `CMSClient` class API and configuration (`ClientOptions`).
- Zod schema conventions in `@repo/wagtail-cms-types`.
- Content modelling: page types (`HomePage`, `LandingPage`, `ContentPage`, `SearchPage`, `NewsListingPage`, `NewsContentPage`), block types (22 in `CMSBlockComponentsKeys`), settings, snippets.
- Data flow: Types -> Client -> App rendering.
- Sub-path export structure for types package.
- Collaborative tone.

---

## 3. Prompts

Seven workflow prompts that guide cross-package changes. Each prompt:
- Uses YAML frontmatter with `name`, `description`, and `mode: "agent"`
- Accepts variables where applicable
- Walks through each package in dependency order
- Includes code templates/scaffolds
- Marks `<!-- TODO: wagtail-cms-mapping -->` where the future mapping package will slot in

### 3.1 `new-page-model.prompt.md`

**Packages touched**: `@repo/wagtail-cms-types` -> app route

Steps:
1. Add new page type string to `CMSPageType` union in `wagtail-cms-types/src/types/core/index.ts`
2. Create Zod schema in `wagtail-cms-types/src/types/page-models/` extending `CMSPageWithBlocks`
3. Add to `CMSPageProps` union in `page-models/index.ts`
4. Create Next.js route in `apps/hse-app-template/src/app/`
5. `<!-- TODO: wagtail-cms-mapping — add layout template mapping here when package exists -->`

### 3.2 `new-streamfield-block.prompt.md`

**Packages touched**: `@repo/wagtail-cms-types`

Steps:
1. Add block key to `CMSBlockComponentsKeys` enum in `wagtail-cms-types/src/types/blocks/base.ts`
2. Create Zod schema for block value in `wagtail-cms-types/src/types/blocks/`
3. Add to `BlockValuesProps` union in `blocks/index.ts`
4. `<!-- TODO: wagtail-cms-mapping — add block-to-component mapping here -->`

### 3.3 `new-page-with-blocks.prompt.md`

**Packages touched**: `@repo/wagtail-cms-types` -> app route

Combines 3.1 and 3.2 — new page model that includes new StreamField blocks. Runs the block steps first, then the page model steps.

### 3.4 `integrate-component.prompt.md`

**Packages touched**: `@repo/wagtail-cms-types`

Steps:
1. Identify the `@hseireland/hse-frontend-react` component to wire up
2. Check Storybook MCP for component props and usage
3. Add/update Zod block schema in types package to match component props
4. Add block key to `CMSBlockComponentsKeys` if new
5. `<!-- TODO: wagtail-cms-mapping — add block-to-component mapping here -->`

### 3.5 `new-local-component.prompt.md`

**Packages touched**: app `components/` directory

Steps:
1. Create component file in `apps/hse-app-template/src/components/`
2. Compose from `@hseireland/hse-frontend-react` elements where possible
3. Use `@hseireland/hse-frontend` SCSS tokens for any custom styling
4. Add Vitest test file alongside the component
5. Export from components index

### 3.6 `new-custom-component.prompt.md`

**Packages touched**: `@repo/hse-custom-ui`

**Note**: The `@repo/hse-custom-ui` package does not exist yet. This prompt documents the expected structure.

Steps:
1. Check if `packages/hse-custom-ui/` exists — if not, scaffold it
2. Create component using `@hseireland/hse-frontend` SCSS tokens/variables for visual consistency
3. Add Vitest tests
4. Export from package

### 3.7 `new-app.prompt.md`

**Packages touched**: root Makefile

Steps:
1. Run the cookiecutter Makefile target
2. Walk through post-creation setup: `pnpm-workspace.yaml` entry, turbo pipeline config, shared configs, dependencies

---

## 4. Skills

Three portable skills in agentskills.io format (`SKILL.md`). These work across Copilot, Claude Code, and CLI tools.

### 4.1 `cms-content-fetching/SKILL.md`

Teaches the full CMS data flow:
1. **Types** (`@repo/wagtail-cms-types`): Zod schemas define all CMS data shapes. Sub-path exports for organization.
2. **Client** (`@repo/wagtail-api-client`): `CMSClient` class fetches from Wagtail API. Key methods: `fetchPage`, `fetchPages`, `findPageByPath`, `fetchPagePreview`, `getMediaSrc`. ISR caching with 360s default revalidation.
3. **Rendering** (app): Fetch in Server Components, validate with Zod, render blocks by discriminating on `block.type`.

Includes:
- Wagtail API v2 endpoint reference (pages, images, documents, find-by-path)
- Query parameter reference (type, fields, child_of, search, order, locale, limit/offset)
- Code examples for common patterns (fetch page by path, fetch page list, render block union)
- `<!-- TODO: wagtail-cms-mapping — mapping layer will sit between Client and Rendering steps -->`

### 4.2 `hse-design-system/SKILL.md`

Teaches how to use the HSE Ireland design system:

**Component catalogue** (from `@hseireland/hse-frontend-react`):
- Layout: `Container`, `Row`, `Col`
- Content presentation: `hero`, `card-list`, `callout`, `notification`, `panel`, `summary-list`, `table`, `video`, `block-quote`, `care-card`, `details`, `do-and-dont-list`, `images`, `inset-text`, `list-item-promo`, `listing`, `warning-callout`
- Navigation: `header`, `footer`, `breadcrumb`, `pagination`, `skip-link`, `back-link`, `contents-list`, `action-link`, `document-link`, `links-list`, `list-panel`, `page-contents`, `promo`, `quick-link`, `related-nav`, `stepper-number`, `header-dropdown`
- Forms: `button`, `checkboxes`, `radios`, `text-input`, `textarea`, `select`, `date-input`, `file-upload`, `error-message`, `fieldset`, `form`, `hint-text`, `label`, `legend`, `search-with-button`
- Typography: (from `typography/` directory)
- Patterns: `nav-a-z`, `pagination-listing`, `review-date`

**SCSS tokens** (from `@hseireland/hse-frontend`):
- `packages/core/settings/`: `_colours.scss`, `_breakpoints.scss`, `_spacing.scss`, `_typography.scss`, `_globals.scss`
- `packages/core/tools/`: mixins for grid, spacing, typography, focus states, media queries (`sass-mq`), links

**Decision guide**:
- Always check `@hseireland/hse-frontend-react` first for existing components
- Use Storybook MCP (`http://localhost:6006/mcp`) to explore component props and variants
- For custom styling, use `@hseireland/hse-frontend` SCSS variables/tokens — never hardcode colours, spacing, or breakpoints
- Do not customize design system components or add inline CSS (HSE policy)
- Layout pattern: `Container` > `Row` > `Col` for grid layouts

### 4.3 `conventional-commit/SKILL.md`

Commit message format enforced by `@repo/commitlint-config`:
- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `style`, `perf`, `build`
- Scopes: app names (`hse-app-template`), package names (`wagtail-api-client`, `wagtail-cms-types`, `logger`, etc.), or omitted for cross-cutting changes
- Body and footer optional
- Breaking changes: `feat!:` or `BREAKING CHANGE:` footer

---

## 5. Updates to Existing Files

### 5.1 `.github/copilot-instructions.md`

Add to the end of the existing file:

```markdown
## Scoped Instructions

Additional instructions activate based on file patterns — see `.github/instructions/`.

## Agents

Specialized agents are available in `.github/agents/`. Invoke them by name in Copilot chat (e.g., `@a11y-reviewer`, `@cms-specialist`).

## Skills

Portable skills in `.github/skills/` teach domain-specific workflows (CMS content fetching, HSE design system, conventional commits).
```

---

## 6. Cross-Tool Portability Strategy

### Principle: Skills as the shared knowledge layer

Agent files are **thin persona wrappers** — they define role, tone, and tool access, then reference skills for domain knowledge. This avoids duplicating CMS knowledge, a11y policies, and design system details across Copilot agents, Claude Code, and other tools.

### How it works

```
.github/skills/                        ← Shared knowledge (portable, cross-tool)
  cms-content-fetching/SKILL.md        ← CMS data flow, Wagtail API, CMSClient usage
  hse-design-system/SKILL.md           ← Component catalogue, SCSS tokens, decision guide
  conventional-commit/SKILL.md         ← Commit format

.github/agents/                        ← Thin Copilot wrappers (persona + tone + skill refs)
  cms-specialist.agent.md              ← "You are a CMS expert. Refer to skills/cms-content-fetching/SKILL.md"
  a11y-reviewer.agent.md               ← "You are an a11y reviewer. Strict tone. Refer to skills/hse-design-system/SKILL.md for components"

CLAUDE.md                              ← Already references architecture; can point to skills/
```

### What goes where

| Content type | Lives in | Referenced by |
|---|---|---|
| Domain knowledge (CMS flow, Wagtail API, component catalogue) | Skills (`SKILL.md`) | Agents, CLAUDE.md, other tools |
| Persona, tone, review checklists | Agents (`.agent.md`) | Copilot only |
| Code conventions, formatting rules | Instructions (`.instructions.md`) + `CLAUDE.md` | Tool-specific (some duplication accepted) |
| Workflow steps (cross-package changes) | Prompts (`.prompt.md`) | Copilot; Claude uses skills for the same knowledge |

### Accepted duplication

`copilot-instructions.md` and `CLAUDE.md` will continue to share similar content (architecture, conventions). This is a small, stable surface — keeping them in sync manually is simpler than adding a build/sync step.

Scoped instructions (`.instructions.md` with `applyTo` globs) have no Claude equivalent (Claude uses directory-based `CLAUDE.md` files). This duplication is accepted since the content is concise and changes infrequently.

---

## Design Decisions

### Mapping package (`wagtail-cms-mapping`)

Several prompts reference a planned `wagtail-cms-mapping` package that doesn't exist yet. Prompts are written for today's architecture (types → client → app) with `<!-- TODO: wagtail-cms-mapping -->` markers where the mapping layer will slot in.

### Awesome-copilot adaptation

Agents are adapted from `github/awesome-copilot` templates, heavily customized for this repo's stack:
- Framework examples stripped to React 19 / Next.js 16 only
- ESLint/Jest references replaced with Biome/Vitest
- CMS integration patterns added
- HSE design system references added
- HSE-specific a11y policies added

### Agent tone

- `a11y-reviewer` and `security-reviewer`: strict enforcement tone ("must fix", "violation")
- All others: collaborative advisory tone ("prefer", "consider")

### `hse-custom-ui` package

The `new-custom-component` prompt references `@repo/hse-custom-ui` which doesn't exist yet. The prompt includes a scaffolding step and a note that the package needs to be created first.

### Skills portability

Skills use the agentskills.io format (`SKILL.md`) which works across Copilot, Claude Code, and CLI tools — most portable option per the planning doc.
