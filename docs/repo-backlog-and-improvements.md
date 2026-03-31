# Repo Backlog and Improvements

Tracked improvements and recommendations for the HSE Recovery Platform frontend monorepo.

## Summary

| # | Item | Priority | Size | Depends on |
|---|------|----------|------|------------|
| 1 | [CI/CD Pipeline](#1-cicd-pipeline) | Must | M | — |
| 2 | [GDPR / Cookie Consent](#2-gdpr--cookie-consent) | Must | L | — |
| 3 | [Security Headers / CSP](#3-security-headers--csp) | Must | S | — |
| 4 | [Accessibility (WCAG)](#4-accessibility-wcag) | Must | M | #1 |
| 5 | [`@repo/wagtail-cms-mapping` Package](#5-repowagtail-cms-mapping-package) | Must | L | — |
| 6 | [`@repo/hse-custom-ui` Package](#6-repohse-custom-ui-package) | Must | M | — |
| 7 | [Error Handling and Resilience](#7-error-handling-and-resilience) | Must | M | — |
| 8 | [Caching and Revalidation Strategy](#8-caching-and-revalidation-strategy) | Must | L | — |
| 9 | [Image Optimisation](#9-image-optimisation) | Must | M | — |
| 10 | [SEO Metadata from CMS](#10-seo-metadata-from-cms) | Must | M | — |
| 11 | [Expand `hse-app-template`](#11-expand-hse-app-template) | Must | XL | #2, #5, #6, #7, #8, #9, #10 |
| 12 | [CMS Preview / Draft Mode](#12-cms-preview--draft-mode) | Must | M | #11 |
| 13 | [App Cookiecutter (Makefile)](#13-app-cookiecutter-makefile) | Should | M | #11 |
| 14 | [Git Hooks (Husky + commitlint)](#14-git-hooks-husky--commitlint) | Should | S | — |
| 15 | [Test Coverage](#15-test-coverage) | Should | M (ongoing) | #1 |
| 16 | [Monitoring and Error Tracking](#16-monitoring-and-error-tracking) | Should | M | — |
| 17 | [Internationalisation (i18n)](#17-internationalisation-i18n) | Could | L | — |
| 18 | [Copilot Agentic Workflow](#18-copilot-agentic-workflow) | Should (parallel) | L | — |
| 19 | [Design System Integration](#19-design-system-integration) | Should (ongoing) | S | — |

**Priority key**: Must = launch blocker | Should = important, not blocking | Could = deferred, but acknowledged

---

## 1. CI/CD Pipeline

No GitHub Actions workflows exist yet. This is the safety net for everything else — without CI, quality gates are unenforced.

- PR workflow: install, lint, typecheck, test with coverage reporting
- Deploy workflow: Cloudflare Workers deployment per app
- Turborepo remote caching for faster CI runs
- Per-app workflows generated automatically when new apps are created via the cookiecutter

---

## 2. GDPR / Cookie Consent

Legal launch blocker for a public-sector Irish health service under the ePrivacy Directive (SI 336/2011) and GDPR.

- OneTrust cookie consent banner implementation
- Consent-gated script loading — no GTM or analytics firing before consent is granted
- Cookie audit/register
- Privacy policy page template
- Consent persistence mechanism (consider Cloudflare KV given the Workers runtime)
- Data protection considerations: even basic analytics on a health service site can imply sensitive data (e.g., visits to specific health topic pages)

---

## 3. Security Headers / CSP

Required for a public-sector healthcare application, especially with third-party scripts (GTM, OneTrust) injecting content.

- Content Security Policy — must accommodate GTM, OneTrust, and any analytics scripts
- Standard security headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, etc.
- Subresource Integrity for third-party scripts where possible
- Cloudflare Workers response header configuration

---

## 4. Accessibility (WCAG)

Legal obligation under the EU Web Accessibility Directive (transposed into Irish law as SI 358/2020). Target **WCAG 2.1 AA** minimum — consider targeting **WCAG 2.2 AA** as the EU is expected to update the Directive.

- Integrate `@axe-core/playwright` or `@axe-core/react` for automated a11y checks
- Playwright test suite running axe audits against key pages
- a11y review step in PR checklist
- Automated a11y checks in CI (depends on #1)

**Depends on**: #1 (CI/CD) to enforce automated checks.

---

## 5. `@repo/wagtail-cms-mapping` Package

Bridge between CMS data and the UI layer. Centralises all mapping logic rather than scattering it across apps.

- **Page models -> layout templates**: Map each Wagtail page type to its layout/template component
- **StreamField blocks -> UI components**: Map block types to `@hseireland/hse-frontend-react` components (and `@repo/hse-custom-ui` where needed)
- **Site settings -> global UI**: Map Wagtail site settings API data (header/footer menus) to header and footer UI components

Data flow: `wagtail-cms-types` (Zod schemas) -> `wagtail-api-client` (fetch + validate) -> `wagtail-cms-mapping` (map to components/templates) -> app (render)

Keep mappings declarative where possible (registry/map object) so new page types and blocks can be added without modifying control flow. Decide whether this is source-only or built with bunchee.

---

## 6. `@repo/hse-custom-ui` Package

Shared package for custom UI components that don't exist in `@hseireland/hse-frontend-react`. Bespoke components needed by the platform, reusable across apps.

- Import SCSS from `@hseireland/hse-frontend` for global variables, mixins, and tokens
- Consumable by all apps via `workspace:*`
- Keeps custom UI out of individual apps so it's shared when new apps are created via the cookiecutter

---

## 7. Error Handling and Resilience

Critical for a public health service where uptime expectations are high.

- Next.js `error.tsx` boundaries per route segment
- Global `global-error.tsx` for the root layout
- `not-found.tsx` for 404 pages (when Wagtail returns 404 for unpublished/deleted pages)
- Fallback UI when the Wagtail CMS API is unreachable (degraded mode)
- Consider how Zod validation failures on CMS responses are surfaced (invalid data from the API should not crash the page)

---

## 8. Caching and Revalidation Strategy

CMS-driven site on Cloudflare Workers needs a deliberate caching approach.

- `fetch()` cache and `revalidate` settings for CMS API calls
- Potential use of Cloudflare KV as a cache layer for CMS responses
- Cache invalidation when content is published in Wagtail (webhook-triggered revalidation via `revalidateTag` or `revalidatePath`)
- Understand ISR / on-demand revalidation constraints on Cloudflare Workers vs Vercel
- Per-environment cache configuration (aggressive in prod, minimal in dev/preview)

---

## 9. Image Optimisation

`next/image` does not work out of the box on Cloudflare Workers — the default Next.js image optimisation is not available. This is a production blocker.

- Evaluate options: Cloudflare Image Resizing, custom loader pointing at Wagtail's rendition API, or third-party image CDN
- Configure the chosen loader in the Next.js config
- Ensure the template app ships with a working image solution

---

## 10. SEO Metadata from CMS

Sitemap and robots.txt are covered in the template expansion (#11), but broader SEO needs its own consideration.

- Dynamic `generateMetadata()` wired to CMS page fields (title, description, Open Graph, Twitter Cards)
- Canonical URL handling (especially important when multiple apps serve related content)
- Structured data / JSON-LD for healthcare content (health topics, services, locations)

---

## 11. Expand `hse-app-template`

Currently a minimal Next.js install with the HSE design system and a hello-world homepage. Needs to become a fully integrated headless Wagtail site that new apps are cloned from.

**Depends on**: #2, #5, #6, #7, #8, #9, #10 — these packages and patterns need to exist before the template can integrate them.

The template should include:

- CMS content fetching via `@repo/wagtail-api-client` (`CMSClient` / `fetchContent`)
- Page routing driven by Wagtail page models, validated via `@repo/wagtail-cms-types` schemas
- StreamField block rendering via `@repo/wagtail-cms-mapping`
- Global site settings integration (header/footer menus from Wagtail site settings API)
- HSE design system layout shell (`@hseireland/hse-frontend-react` header, footer, nav)
- Example page template showing the full data flow (fetch -> validate -> map -> render)
- Sitemap generation using the Wagtail pages API
- `robots.txt` generated from the Wagtail site settings API endpoint
- Third-party script includes: GTM, OneTrust (consent-gated per #2), and potentially others
- Error boundaries and not-found handling (per #7)
- Image optimisation (per #9)
- SEO metadata (per #10)
- Environment config for Wagtail API base URL, third-party script IDs (Cloudflare Workers compatible)
- Loading states / Suspense boundaries for CMS fetch latency

The goal: when someone runs the cookiecutter, they get a working headless CMS site out of the box.

---

## 12. CMS Preview / Draft Mode

Core editorial workflow — without this, content editors cannot preview unpublished content on the frontend.

- Next.js Draft Mode (`draftMode()` from `next/headers`) integration
- Preview API route authenticated between Wagtail and the frontend
- Wagtail draft/preview API wired through `@repo/wagtail-api-client`
- Visual indicator in the UI when viewing draft content

**Depends on**: #11 (template must have CMS integration in place first).

---

## 13. App Cookiecutter (Makefile)

A `make new-app` style command that clones `apps/hse-app-template` into a new app workspace — copies the directory, renames package.json fields, README, wrangler config, etc. Simple enough for non-FE devs (e.g., DevOps) to run.

- Should also automate related setup like GitHub Actions workflows for build/deploy of the new app
- Create Copilot prompts so developers can offload the process to their AI assistant, with the Makefile as the source of truth

**Depends on**: #11 (template must be complete before it's worth cloning).

---

## 14. Git Hooks (Husky + commitlint)

The `@repo/commitlint-config` package exists but Conventional Commits are not enforced at the Git level. No Husky or lint-staged installed.

- Husky + commitlint `commit-msg` hook to enforce Conventional Commits
- `pre-commit` hook running a root script (`turbo run lint typecheck test`) — consider lint-staged with Biome for faster feedback on staged files, with the full suite in CI
- Portable — works in any terminal, editor, or CI environment

---

## 15. Test Coverage

~5 test files for ~34 source files. Coverage concentrated in `wagtail-cms-client` and `logger`.

- Prioritise tests for Zod schemas in `@repo/wagtail-cms-types` — these are the contract between the CMS and the frontend
- Add tests for utility functions and helpers as they are created
- Establish a coverage threshold in `createVitestConfig()` once baseline coverage is known
- CI enforcement (depends on #1) so thresholds can't be silently broken

**Depends on**: #1 (CI/CD) to enforce thresholds.

---

## 16. Monitoring and Error Tracking

The `@repo/logger` package exists but has no production backend.

- Runtime error tracking (Sentry or similar) for Cloudflare Workers
- Structured logging connected to an observability backend
- Cloudflare Workers analytics / performance monitoring
- Core Web Vitals reporting

---

## 17. Internationalisation (i18n)

HSE Ireland has obligations to provide content in Irish (Gaeilge) under the Official Languages Act. Even if deferred for v1, architectural decisions now should not preclude i18n later.

- i18n routing strategy
- Translation mechanism (CMS-driven vs. frontend i18n library)
- Wagtail multi-language content support

---

## 18. Copilot Agentic Workflow

Parallel workstream — does not block feature delivery but accelerates team productivity once patterns are established.

Full details in [docs/copilot-agentic-setup.md](copilot-agentic-setup.md).

Summary: set up Copilot agents (a11y, Next.js, React, GH Actions, security, CMS), path-scoped instructions, cross-package prompts (new-page-model, new-streamfield-block, integrate-component, etc.), and skills for the most common workflows. Build incrementally as codebase patterns stabilise.

---

## 19. Design System Integration

The app uses `@hseireland/hse-frontend` (CSS/tokens) and `@hseireland/hse-frontend-react` (React components) from GitHub Packages.

- Developers should run the `hse-frontend-react` project in a separate VS Code instance to browse available components. Storybook is not needed in this repo.
- Ensure HSE design system tokens are used consistently rather than raw hex values or one-off spacing.
- Track updates to `@hseireland/hse-frontend-react` and adopt new components as they become available.
