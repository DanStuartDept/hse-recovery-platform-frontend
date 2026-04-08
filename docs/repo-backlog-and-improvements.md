# Repo Backlog and Improvements

Tracked improvements and recommendations for the HSE Multisite Frontend monorepo.

## Summary

| #   | Item                                                                          | Priority              | Size        | Depends on                  |
| --- | ----------------------------------------------------------------------------- | --------------------- | ----------- | --------------------------- |
| 1   | ~~[CI/CD Pipeline](#1-cicd-pipeline)~~                                        | ~~Must~~              | ~~M~~       | Done                        |
| 2   | [GDPR / Cookie Consent](#2-gdpr--cookie-consent)                              | Must                  | L           | —                           |
| 3   | ~~[Security Headers / CSP](#3-security-headers--csp)~~                        | ~~Must~~              | ~~S~~       | Done                        |
| 4   | [Accessibility (WCAG)](#4-accessibility-wcag)                                 | Must                  | M           | #1                          |
| 5   | ~~[`@repo/wagtail-cms-mapping` Package](#5-repowagtail-cms-mapping-package)~~ | ~~Must~~              | ~~L~~       | Done                        |
| 6   | [`@repo/hse-custom-ui` Package](#6-repohse-custom-ui-package)                 | Must                  | M           | —                           |
| 7   | [Error Handling and Resilience](#7-error-handling-and-resilience)             | Must                  | M           | In progress                 |
| 8   | [Caching and Revalidation Strategy](#8-caching-and-revalidation-strategy)     | Must                  | L           | —                           |
| 9   | [Image Optimisation](#9-image-optimisation)                                   | Must                  | M           | —                           |
| 10  | [SEO Metadata from CMS](#10-seo-metadata-from-cms)                            | Must                  | M           | —                           |
| 11  | [Expand `hse-multisite-template`](#11-expand-hse-multisite-template)          | Must                  | XL          | #2, #5, #6, #7, #8, #9, #10 |
| 12  | [CMS Preview / Draft Mode](#12-cms-preview--draft-mode)                       | Must                  | M           | #11                         |
| 13  | [App Cookiecutter (Makefile)](#13-app-cookiecutter-makefile)                  | Should                | M           | #11                         |
| 14  | ~~[Git Hooks (Husky + commitlint)](#14-git-hooks-husky--commitlint)~~         | ~~Should~~            | ~~S~~       | Done                        |
| 15  | [Test Coverage](#15-test-coverage)                                            | Should                | M (ongoing) | #1                          |
| 16  | [Monitoring and Error Tracking](#16-monitoring-and-error-tracking)            | Should                | M           | —                           |
| 17  | [Internationalisation (i18n)](#17-internationalisation-i18n)                  | Must                  | L           | Research needed             |
| 18  | ~~[Copilot Agentic Workflow](#18-copilot-agentic-workflow)~~                  | ~~Should (parallel)~~ | ~~L~~       | Done                        |
| 19  | [Design System Integration](#19-design-system-integration)                    | Should (ongoing)      | S           | —                           |

**Priority key**: Must = launch blocker | Should = important, not blocking | Could = deferred, but acknowledged

---

## 1. CI/CD Pipeline ✅

**Done.** PR workflow with parallel lint, typecheck, test (with per-package coverage), and build jobs. Consolidated CI report posted as a PR comment. Reusable composite setup action. Turbo `--affected` for incremental checks.

- Deploy workflow: deployment per app (deferred until apps are production-ready)
- Turborepo remote caching for faster CI runs
- Per-app workflows generated automatically when new apps are created via the cookiecutter

---

## 2. GDPR / Cookie Consent

Legal launch blocker for a public-sector Irish health service under the ePrivacy Directive (SI 336/2011) and GDPR.

- OneTrust cookie consent banner implementation
- Consent-gated script loading — no GTM or analytics firing before consent is granted
- Cookie audit/register
- Privacy policy page template
- Consent persistence mechanism
- Data protection considerations: even basic analytics on a health service site can imply sensitive data (e.g., visits to specific health topic pages)

---

## 3. Security Headers / CSP ✅

**Done.** Security headers configured in `apps/hse-multisite-template/next.config.ts` via the `headers()` function, applied to all routes.

- Content Security Policy with per-directive source arrays (script, style, img, connect, frame, font)
- CSP covers known integrations: GTM, OneTrust, Piwik Pro, HSE domains
- Standard security headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- `frame-ancestors 'none'` in CSP + `X-Frame-Options: DENY` for clickjacking protection
- Subresource Integrity for third-party scripts where possible (deferred — depends on how GTM/OneTrust are loaded)

---

## 4. Accessibility (WCAG)

Legal obligation under the EU Web Accessibility Directive (transposed into Irish law as SI 358/2020). Target **WCAG 2.1 AA** minimum — consider targeting **WCAG 2.2 AA** as the EU is expected to update the Directive.

- Integrate `@axe-core/playwright` or `@axe-core/react` for automated a11y checks
- Playwright test suite running axe audits against key pages
- a11y review step in PR checklist
- Automated a11y checks in CI (depends on #1)

**Depends on**: #1 (CI/CD) to enforce automated checks.

---

## 5. `@repo/wagtail-cms-mapping` Package ✅

**Done.** Factory-based CMS-to-component mapping with HSE design system defaults and per-app override support. Source-only package (no build step).

- `createCMSRenderer()` factory with required `apiClient` and optional block/page overrides
- Rich context threading: every block receives page data, API client, and position metadata via props (Server Component compatible — no React Context)
- 14 block components mapped to 18 block types (including aliases)
- 5 page layout components for all hsebase page types
- Type guards, `generateRichText` utility, breadcrumb and page title shared components
- TSDoc documentation on all exported functions, types, components, and registries
- 34 tests covering factory logic, context threading, position computation, registry completeness, type guards, and utilities
- Header/footer settings mapping is out of scope — will be addressed separately

---

## 6. `@repo/hse-custom-ui` Package

Shared package for custom UI components that don't exist in `@hseireland/hse-frontend-react`. Bespoke components needed by the platform, reusable across apps.

- Import SCSS from `@hseireland/hse-frontend` for global variables, mixins, and tokens
- Consumable by all apps via `workspace:*`
- Keeps custom UI out of individual apps so it's shared when new apps are created via the cookiecutter

---

## 7. Error Handling and Resilience

**Partial.** Error pages (`not-found.tsx`, `error.tsx`, `global-error.tsx`) implemented. Remaining: CMS degraded mode, Zod validation error surfacing.

- ~~Next.js `error.tsx` boundaries per route segment~~
- ~~Global `global-error.tsx` for the root layout~~
- ~~`not-found.tsx` for 404 pages (when Wagtail returns 404 for unpublished/deleted pages)~~
- Fallback UI when the Wagtail CMS API is unreachable (degraded mode)
- Consider how Zod validation failures on CMS responses are surfaced (invalid data from the API should not crash the page)

---

## 8. Caching and Revalidation Strategy

CMS-driven site needs a deliberate caching approach.

- `fetch()` cache and `revalidate` settings for CMS API calls
- Cache invalidation when content is published in Wagtail (webhook-triggered revalidation via `revalidateTag` or `revalidatePath`)
- Per-environment cache configuration (aggressive in prod, minimal in dev/preview)

---

## 9. Image Optimisation

Image optimisation strategy needs to be decided.

- Evaluate options: custom loader pointing at Wagtail's rendition API, or third-party image CDN
- Configure the chosen loader in the Next.js config
- Ensure the template app ships with a working image solution

---

## 10. SEO Metadata from CMS

Sitemap and robots.txt are covered in the template expansion (#11), but broader SEO needs its own consideration.

- Dynamic `generateMetadata()` wired to CMS page fields (title, description, Open Graph, Twitter Cards)
- Canonical URL handling (especially important when multiple apps serve related content)
- Structured data / JSON-LD for healthcare content (health topics, services, locations)

---

## 11. Expand `hse-multisite-template`

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
- Environment config for Wagtail API base URL, third-party script IDs
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

A `make new-app` style command that clones `apps/hse-multisite-template` into a new app workspace — copies the directory, renames package.json fields, README, etc. Simple enough for non-FE devs (e.g., DevOps) to run.

- Should also automate related setup like GitHub Actions workflows for build/deploy of the new app
- Create Copilot prompts so developers can offload the process to their AI assistant, with the Makefile as the source of truth

**Depends on**: #11 (template must be complete before it's worth cloning).

---

## 14. Git Hooks (Husky + commitlint) ✅

**Done.** Husky + lint-staged enforcing Conventional Commits (commitlint commit-msg hook) and code quality (pre-commit hook running Biome on staged files via lint-staged, plus turbo typecheck and test).

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

- Runtime error tracking (Sentry or similar)
- Structured logging connected to an observability backend
- Performance monitoring
- Core Web Vitals reporting

---

## 17. Internationalisation (i18n)

HSE Ireland has obligations to provide content in Irish (Gaeilge) under the Official Languages Act (Acht na dTeangacha Oifigiúla). Baseline locales are `en-ie` (default) and `ga`, but individual apps may support additional locales (e.g., `uk` Ukrainian, `pl` Polish) so the system must not hardcode a fixed locale list.

**Needs research** — several open architectural questions below.

### Routing

- Dynamic catch-all route: `src/app/[locale]/[[...slug]]/page.tsx`
- Default locale (`en-ie`) hidden from URL: `www.hse.ie/about/` not `www.hse.ie/en-ie/about/`
- Irish locale prefixed: `www.hse.ie/ga/about/`
- Trailing slashes enabled (existing preference across HSE sites)
- Investigate Next.js 16 i18n routing support and whether `next.config.ts` `i18n` config or middleware-based approach is appropriate

### Configuration

- **Open question:** Should locale settings (available locales, default locale, fallback behaviour) live in `@repo/app-config` (shared across all apps) or at the app level? Consider: `en-ie` and `ga` are baseline for all apps, but some apps need additional locales (Ukrainian, Polish, etc.)
- Locale list must be extensible per-app — not a fixed enum
- Default locale, available locales, and URL behaviour should be configurable

### Dictionaries and translations

- Static dictionaries for `en-ie` and `ga` (UI strings, labels, common phrases — not CMS content)
- Dictionary storage: both shared (common UI strings across all apps) and per-app (app-specific strings)
- String encapsulation: `getDictionary(locale)` pattern returning a typed dictionary object
- Interpolation support for dynamic values in translated strings (e.g., `"Welcome, {name}"`)
- Server Components: `await getDictionary(locale)` directly
- Client Components: dictionary provider (React Context) so client trees don't need prop-drilling

### CMS content

- Wagtail multi-language content handling (CMS pages are translated in Wagtail, not in frontend dictionaries)
- How locale is passed to `CMSClient` / `fetchContent` API calls
- Relationship between URL locale segment and CMS content locale

---

## 18. Copilot Agentic Workflow ✅

**Done.** Agents, path-scoped instructions, cross-package prompts, and skills are in place.

- 5 agents: a11y-reviewer, nextjs-developer, react-expert, gh-actions-expert, cms-specialist
- Path-scoped instructions for CMS packages, TypeScript conventions
- Prompts: new-page-model, new-streamfield-block, integrate-component, new-page-with-blocks, scaffold-app, scaffold-component
- Skills: cms-content-fetching, hse-design-system, conventional-commits
- CLAUDE.md project instructions for Claude Code
- Will evolve incrementally as codebase patterns change

---

## 19. Design System Integration

The app uses `@hseireland/hse-frontend` (CSS/tokens) and `@hseireland/hse-frontend-react` (React components) from GitHub Packages.

- Developers should run the `hse-frontend-react` project in a separate VS Code instance to browse available components. Storybook is not needed in this repo.
- Ensure HSE design system tokens are used consistently rather than raw hex values or one-off spacing.
- Track updates to `@hseireland/hse-frontend-react` and adopt new components as they become available.
