# Docusaurus Documentation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an HSE-branded Docusaurus 3.10.0 documentation site at `apps/docs` as a full Turborepo workspace member, with auto-generated TypeDoc API reference and hand-authored guides.

**Architecture:** Docusaurus static site in `apps/docs`, wired into the Turborepo pipeline for build/dev/lint/typecheck. HSE branding via CSS custom properties. TypeDoc plugin (multi-instance) auto-generates API reference from five internal packages. GitHub Pages deployment via a dedicated workflow triggered on push to `main`.

**Tech Stack:** Docusaurus 3.10.0, TypeDoc, typedoc-plugin-markdown, docusaurus-plugin-typedoc, Biome, TypeScript, React 18 (Docusaurus requirement — separate from monorepo's React 19 catalog)

**Spec:** `docs/superpowers/specs/2026-04-09-docusaurus-docs-site-design.md`

---

## File Map

### New files (apps/docs/)

| File | Responsibility |
|---|---|
| `apps/docs/package.json` | Workspace config, scripts, dependencies |
| `apps/docs/docusaurus.config.ts` | Main Docusaurus config: site metadata, presets, plugins, navbar, footer |
| `apps/docs/sidebars.ts` | Sidebar definitions (guide + API reference) |
| `apps/docs/tsconfig.json` | TypeScript config extending `@repo/typescript-config/base` |
| `apps/docs/biome.json` | Biome config extending `@repo/biome-config/base` |
| `apps/docs/src/css/custom.css` | HSE branding: colour tokens, typography, dark mode |
| `apps/docs/static/img/logo-hse.svg` | HSE logo (copied from design system) |
| `apps/docs/static/img/favicon.svg` | HSE favicon (copied from design system) |
| `apps/docs/docs/getting-started/prerequisites.md` | Node, pnpm, npm token requirements |
| `apps/docs/docs/getting-started/installation.md` | Clone, install, first build |
| `apps/docs/docs/getting-started/running-locally.md` | Dev server, environment variables |
| `apps/docs/docs/getting-started/project-overview.md` | What this monorepo is and why |
| `apps/docs/docs/architecture/monorepo-structure.md` | Workspace layout, package roles |
| `apps/docs/docs/architecture/turborepo-pipeline.md` | Task graph, caching, filtering |
| `apps/docs/docs/architecture/package-dependency-graph.md` | How packages depend on each other |
| `apps/docs/docs/architecture/cms-content-flow.md` | CMSClient -> Zod -> createCMSRenderer pipeline |
| `apps/docs/docs/architecture/i18n-routing.md` | Locale middleware, dictionary loading |
| `apps/docs/docs/architecture/caching-strategy.md` | SSG + ISR + on-demand revalidation |
| `apps/docs/docs/packages/app-config.md` | @repo/app-config usage and env vars |
| `apps/docs/docs/packages/wagtail-api-client.md` | CMSClient API, error handling |
| `apps/docs/docs/packages/wagtail-cms-types.md` | Zod schemas, block/page types |
| `apps/docs/docs/packages/wagtail-cms-mapping.md` | createCMSRenderer, block/page registries |
| `apps/docs/docs/packages/i18n.md` | Locale routing, dictionaries, translation helpers |
| `apps/docs/docs/packages/logger.md` | Logger API |
| `apps/docs/docs/packages/shared-configs.md` | Biome, TypeScript, Vitest, commitlint configs |
| `apps/docs/docs/app-guide/app-structure.md` | hse-multisite-template directory layout |
| `apps/docs/docs/app-guide/routing.md` | [lang]/[[...slug]] catch-all routing |
| `apps/docs/docs/app-guide/layouts-and-error-boundaries.md` | Root layout, error.tsx, not-found.tsx |
| `apps/docs/docs/app-guide/cms-page-rendering.md` | How CMS pages become React components |
| `apps/docs/docs/app-guide/adding-block-components.md` | How to add a new CMS block |
| `apps/docs/docs/app-guide/adding-page-types.md` | How to add a new CMS page type |
| `apps/docs/docs/app-guide/analytics-integration.md` | GTM, OneTrust, Piwik setup |
| `apps/docs/docs/app-guide/seo-and-metadata.md` | generatePageMetadata, robots, sitemap |
| `apps/docs/docs/app-guide/security-headers.md` | CSP, security headers config |
| `apps/docs/docs/deployment/environment-variables.md` | Full env var reference table |
| `apps/docs/docs/deployment/docker-build.md` | Multi-stage Docker build walkthrough |
| `apps/docs/docs/deployment/ci-cd-pipeline.md` | PR workflow, what each job does |
| `apps/docs/docs/deployment/github-pages-docs.md` | How the docs site itself is deployed |
| `apps/docs/docs/deployment/troubleshooting.md` | Common deploy issues |
| `apps/docs/docs/onboarding-sites/index.md` | Placeholder landing page for future content |

### Modified files

| File | Change |
|---|---|
| `turbo.json` | Add `docs#build` output `build/**` |
| `.dockerignore` | Add `apps/docs` exclusion |

### New files (CI)

| File | Responsibility |
|---|---|
| `.github/workflows/docs.yml` | GitHub Pages deployment workflow |

---

## Task 1: Scaffold Docusaurus workspace

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/biome.json`

- [ ] **Step 1: Create `apps/docs/package.json`**

```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "docusaurus start",
    "build": "docusaurus build",
    "serve": "docusaurus serve",
    "typecheck": "tsc --noEmit",
    "lint": "biome check --write",
    "clear": "docusaurus clear"
  },
  "dependencies": {
    "@docusaurus/core": "3.10.0",
    "@docusaurus/preset-classic": "3.10.0",
    "@mdx-js/react": "^3.0.0",
    "prism-react-renderer": "^2.3.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "3.10.0",
    "@docusaurus/tsconfig": "3.10.0",
    "@docusaurus/types": "3.10.0",
    "docusaurus-plugin-typedoc": "^1.4.0",
    "typedoc": "^0.28.0",
    "typedoc-plugin-markdown": "^4.6.0",
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "typescript": "catalog:"
  },
  "engines": {
    "node": ">=24"
  }
}
```

- [ ] **Step 2: Create `apps/docs/tsconfig.json`**

```json
{
  "extends": "@docusaurus/tsconfig",
  "compilerOptions": {
    "baseUrl": ".",
    "noEmit": true
  },
  "include": ["src/", "docs/", "docusaurus.config.ts", "sidebars.ts"]
}
```

> Note: We extend `@docusaurus/tsconfig` instead of `@repo/typescript-config/base` because Docusaurus requires specific JSX and module settings. The Docusaurus tsconfig is the recommended base for Docusaurus projects.

- [ ] **Step 3: Create `apps/docs/biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "extends": ["@repo/biome-config/base"]
}
```

- [ ] **Step 4: Run `pnpm install` from repo root**

Run: `pnpm install`
Expected: Installs all dependencies including Docusaurus packages. Lock file updated. No errors.

- [ ] **Step 5: Verify workspace is recognised**

Run: `pnpm ls --filter=docs --depth=0`
Expected: Shows `docs` workspace with its direct dependencies listed.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/package.json apps/docs/tsconfig.json apps/docs/biome.json pnpm-lock.yaml
git commit -m "feat(apps): scaffold Docusaurus docs workspace

Add apps/docs as a Turborepo workspace member with Docusaurus 3.10.0,
Biome linting, TypeScript, and TypeDoc plugin dependencies."
```

---

## Task 2: Docusaurus config and static assets

**Files:**
- Create: `apps/docs/docusaurus.config.ts`
- Create: `apps/docs/sidebars.ts`
- Create: `apps/docs/static/img/logo-hse.svg` (copy from design system)
- Create: `apps/docs/static/img/favicon.svg` (copy from design system)

- [ ] **Step 1: Copy HSE logo and favicon from design system**

```bash
mkdir -p apps/docs/static/img
cp node_modules/.pnpm/@hseireland+hse-frontend@5.0.0/node_modules/@hseireland/hse-frontend/packages/assets/logos/logo-hse.svg apps/docs/static/img/logo-hse.svg
cp node_modules/.pnpm/@hseireland+hse-frontend@5.0.0/node_modules/@hseireland/hse-frontend/packages/assets/favicons/favicon.svg apps/docs/static/img/favicon.svg
```

- [ ] **Step 2: Create `apps/docs/docusaurus.config.ts`**

```ts
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "HSE Multisite Docs",
	tagline: "Documentation for the HSE Multisite Frontend monorepo",
	favicon: "img/favicon.svg",

	url: "https://dept.github.io",
	baseUrl: "/hse-multisite-frontend/",
	organizationName: "dept",
	projectName: "hse-multisite-frontend",
	trailingSlash: false,

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					routeBasePath: "/",
				},
				blog: false,
				theme: {
					customCss: ["./src/css/custom.css"],
				},
			} satisfies Preset.Options,
		],
	],

	plugins: [
		[
			"docusaurus-plugin-typedoc",
			{
				id: "api-client",
				entryPoints: ["../../packages/wagtail-cms-client/src/index.ts"],
				tsconfig: "../../packages/wagtail-cms-client/tsconfig.json",
				out: "api/wagtail-api-client",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "cms-types",
				entryPoints: ["../../packages/wagtail-cms-types/src/index.ts"],
				tsconfig: "../../packages/wagtail-cms-types/tsconfig.json",
				out: "api/wagtail-cms-types",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "cms-mapping",
				entryPoints: ["../../packages/wagtail-cms-mapping/src/index.ts"],
				tsconfig: "../../packages/wagtail-cms-mapping/tsconfig.json",
				out: "api/wagtail-cms-mapping",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "app-config",
				entryPoints: ["../../packages/app-config/src/index.ts"],
				tsconfig: "../../packages/app-config/tsconfig.json",
				out: "api/app-config",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "i18n-pkg",
				entryPoints: ["../../packages/i18n/src/index.ts"],
				tsconfig: "../../packages/i18n/tsconfig.json",
				out: "api/i18n",
				sidebar: { autoConfiguration: true },
			},
		],
	],

	themeConfig: {
		navbar: {
			title: "HSE Multisite Docs",
			logo: {
				alt: "HSE Logo",
				src: "img/logo-hse.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "guideSidebar",
					position: "left",
					label: "Guide",
				},
				{
					type: "docSidebar",
					sidebarId: "apiSidebar",
					position: "left",
					label: "API Reference",
				},
				{
					href: "https://github.com/dept/hse-multisite-frontend",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{ label: "Getting Started", to: "/getting-started/prerequisites" },
						{ label: "Architecture", to: "/architecture/monorepo-structure" },
						{ label: "Deployment", to: "/deployment/environment-variables" },
					],
				},
				{
					title: "Resources",
					items: [
						{
							label: "HSE Service Manual",
							href: "https://service-manual.hse.ie",
						},
						{
							label: "GitHub",
							href: "https://github.com/dept/hse-multisite-frontend",
						},
					],
				},
			],
			copyright: `Copyright \u00a9 ${new Date().getFullYear()} Health Service Executive`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["bash", "json", "yaml", "docker"],
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
```

- [ ] **Step 3: Create `apps/docs/sidebars.ts`**

```ts
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
	guideSidebar: [
		{
			type: "category",
			label: "Getting Started",
			items: [
				"getting-started/prerequisites",
				"getting-started/installation",
				"getting-started/running-locally",
				"getting-started/project-overview",
			],
		},
		{
			type: "category",
			label: "Architecture",
			items: [
				"architecture/monorepo-structure",
				"architecture/turborepo-pipeline",
				"architecture/package-dependency-graph",
				"architecture/cms-content-flow",
				"architecture/i18n-routing",
				"architecture/caching-strategy",
			],
		},
		{
			type: "category",
			label: "Packages",
			items: [
				"packages/app-config",
				"packages/wagtail-api-client",
				"packages/wagtail-cms-types",
				"packages/wagtail-cms-mapping",
				"packages/i18n",
				"packages/logger",
				"packages/shared-configs",
			],
		},
		{
			type: "category",
			label: "App Guide",
			items: [
				"app-guide/app-structure",
				"app-guide/routing",
				"app-guide/layouts-and-error-boundaries",
				"app-guide/cms-page-rendering",
				"app-guide/adding-block-components",
				"app-guide/adding-page-types",
				"app-guide/analytics-integration",
				"app-guide/seo-and-metadata",
				"app-guide/security-headers",
			],
		},
		{
			type: "category",
			label: "Deployment",
			items: [
				"deployment/environment-variables",
				"deployment/docker-build",
				"deployment/ci-cd-pipeline",
				"deployment/github-pages-docs",
				"deployment/troubleshooting",
			],
		},
		{
			type: "category",
			label: "Onboarding Sites",
			items: ["onboarding-sites/index"],
		},
	],
	apiSidebar: [
		{
			type: "category",
			label: "API Reference",
			items: [
				{
					type: "autogenerated",
					dirName: "api",
				},
			],
		},
	],
};

export default sidebars;
```

- [ ] **Step 4: Commit**

```bash
git add apps/docs/docusaurus.config.ts apps/docs/sidebars.ts apps/docs/static/
git commit -m "feat(apps): add Docusaurus config, sidebars, and HSE assets

Configure site metadata, navbar, footer, TypeDoc plugin instances,
and copy HSE logo + favicon from design system."
```

---

## Task 3: HSE branding CSS

**Files:**
- Create: `apps/docs/src/css/custom.css`

- [ ] **Step 1: Create `apps/docs/src/css/custom.css`**

```css
/* HSE Design System branding for Docusaurus */
/* Colour values from @hseireland/hse-frontend v5.0.0 */
/* Reference: https://service-manual.hse.ie/design-system/styles/colour */

:root {
	/* Primary — HSE purple-700 */
	--ifm-color-primary: #5f3dc4;
	--ifm-color-primary-dark: #4c2fb0;
	--ifm-color-primary-darker: #42299a;
	--ifm-color-primary-darkest: #301e71;
	--ifm-color-primary-light: #7555d0;
	--ifm-color-primary-lighter: #8b6dd8;
	--ifm-color-primary-lightest: #a88fe3;

	/* Links — HSE blue-500 / blue-800 */
	--ifm-link-color: #0b55b7;
	--ifm-link-hover-color: #07336e;

	/* Typography */
	--ifm-font-family-base: Arial, sans-serif;
	--ifm-heading-font-weight: 600;
	--ifm-font-weight-bold: 600;

	/* Colours */
	--ifm-background-color: #f3f3f3;
	--ifm-font-color-base: #212b32;

	/* Code blocks */
	--ifm-code-font-size: 95%;

	/* Footer */
	--ifm-footer-background-color: #212b32;
	--ifm-footer-color: #f3f3f3;
	--ifm-footer-link-color: #73e6c2;
	--ifm-footer-link-hover-color: #80ffd8;

	/* Navbar */
	--ifm-navbar-background-color: #ffffff;
	--ifm-navbar-link-color: #212b32;
	--ifm-navbar-link-hover-color: #5f3dc4;
}

[data-theme="dark"] {
	--ifm-color-primary: #8b6dd8;
	--ifm-color-primary-dark: #7555d0;
	--ifm-color-primary-darker: #5f3dc4;
	--ifm-color-primary-darkest: #4c2fb0;
	--ifm-color-primary-light: #a88fe3;
	--ifm-color-primary-lighter: #c4b1ed;
	--ifm-color-primary-lightest: #e0d3f7;

	--ifm-link-color: #6d99d4;
	--ifm-link-hover-color: #ceddf1;

	--ifm-background-color: #212b32;
	--ifm-font-color-base: #f3f3f3;

	--ifm-footer-background-color: #00473e;
}

/* Navbar logo sizing */
.navbar__logo img {
	height: 32px;
}

/* Sidebar active item uses HSE green for focus */
.menu__link--active:not(.menu__link--sublist) {
	border-left-color: #02a78b;
}
```

- [ ] **Step 2: Verify the directory structure**

```bash
ls -la apps/docs/src/css/
```

Expected: `custom.css` present.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/css/custom.css
git commit -m "feat(apps): add HSE branding CSS for docs site

Apply HSE design system colours, typography, and dark mode
overrides to Docusaurus theme tokens."
```

---

## Task 4: Turborepo and Docker integration

**Files:**
- Modify: `turbo.json`
- Modify: `.dockerignore`

- [ ] **Step 1: Update `turbo.json` — add docs build output**

In `turbo.json`, the existing `build` task already has `outputs: [".next/**", "!.next/cache/**", "dist/**"]`. Add `"build/**"` to the outputs array so Docusaurus build output is cached:

```json
"build": {
  "dependsOn": ["^build"],
  "inputs": ["$TURBO_DEFAULT$", ".env*"],
  "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
}
```

- [ ] **Step 2: Update `.dockerignore` — exclude docs app**

Add after the `# Documentation / reference` section:

```
# Docs site (not needed in app Docker builds)
apps/docs
```

- [ ] **Step 3: Verify Turborepo recognises the docs workspace**

Run: `pnpm exec turbo run build --filter=docs --dry-run`
Expected: Shows `docs#build` task in the execution plan with its dependencies.

- [ ] **Step 4: Commit**

```bash
git add turbo.json .dockerignore
git commit -m "chore(configs): integrate docs into Turborepo pipeline

Add build/** to turbo outputs for Docusaurus caching.
Exclude apps/docs from Docker build context."
```

---

## Task 5: Stub content — Getting Started

**Files:**
- Create: `apps/docs/docs/getting-started/prerequisites.md`
- Create: `apps/docs/docs/getting-started/installation.md`
- Create: `apps/docs/docs/getting-started/running-locally.md`
- Create: `apps/docs/docs/getting-started/project-overview.md`

- [ ] **Step 1: Create `apps/docs/docs/getting-started/prerequisites.md`**

```markdown
---
sidebar_position: 1
---

# Prerequisites

Before working with this monorepo, ensure you have the following installed:

## Required software

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | >= 24 | [nodejs.org](https://nodejs.org/) or use `nvm install 24` |
| **pnpm** | 10.33.0 (exact) | Installed automatically via `corepack enable` — the `packageManager` field in root `package.json` pins the version |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

## GitHub Packages access

This monorepo depends on private packages from the `@hseireland` scope, hosted on GitHub Packages. You need a GitHub personal access token (classic) with `read:packages` scope.

### Setup

1. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) with `read:packages` scope
2. The repo's `.npmrc` already configures the `@hseireland` registry to point at `https://npm.pkg.github.com`
3. Authenticate by setting the token in your environment:

```bash
export NPM_TOKEN=ghp_your_token_here
```

Or add it to your shell profile (`~/.zshrc`, `~/.bashrc`) so it persists across sessions.

:::tip
If `pnpm install` fails with a 401 or 403 error on `@hseireland` packages, your token is missing or expired.
:::

## Editor setup

- **VS Code** with the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) for formatting and linting
- Disable ESLint and Prettier extensions for this workspace — Biome replaces both
```

- [ ] **Step 2: Create `apps/docs/docs/getting-started/installation.md`**

```markdown
---
sidebar_position: 2
---

# Installation

## Clone the repository

```bash
git clone git@github.com:dept/hse-multisite-frontend.git
cd hse-multisite-frontend
```

## Enable corepack

Corepack ensures you use the exact pnpm version pinned in `package.json`:

```bash
corepack enable
```

## Install dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces (apps and packages) in a single step.

## Build all packages

```bash
pnpm build
```

Some packages (`@repo/wagtail-api-client`, `@repo/logger`) need to be built before the app can run. The Turborepo pipeline handles the correct build order automatically.

## Verify the setup

```bash
pnpm typecheck  # Should pass with no errors
pnpm lint        # Should pass (auto-fixes on run)
pnpm test        # Should pass all tests
```

If all three pass, you're ready to develop.
```

- [ ] **Step 3: Create `apps/docs/docs/getting-started/running-locally.md`**

```markdown
---
sidebar_position: 3
---

# Running locally

## Start the dev server

```bash
pnpm dev
```

This starts all workspace dev servers via Turborepo. The main app runs at [http://localhost:3000](http://localhost:3000).

To run only a specific workspace:

```bash
turbo run dev --filter=hse-multisite-template
```

## Environment variables

The app requires environment variables to connect to the Wagtail CMS backend. Create a `.env.local` file in `apps/hse-multisite-template/`:

```bash
# Required
NEXT_PUBLIC_CMS_API_ENDPOINT=https://your-cms-instance.example.com
NEXT_PUBLIC_API_PATH=/api/v2
NEXT_PUBLIC_ENVIRONMENT_NAME=localhost
NEXT_PUBLIC_SITEURL=http://localhost:3000

# Required for server features
PREVIEW_TOKEN=your-preview-token
REVALIDATE_TOKEN=your-revalidate-token
```

See [Environment Variables](/deployment/environment-variables) for the full reference.

## Hot reload

Next.js hot-reloads on file changes in the app. Changes to internal packages (`packages/*`) also trigger hot-reload because they are linked via `workspace:*` protocol.

:::note
If you modify a **built** package (`@repo/wagtail-api-client` or `@repo/logger`), you need to rebuild it:

```bash
turbo run build --filter=@repo/wagtail-api-client
```

Source-only packages (`@repo/app-config`, `@repo/wagtail-cms-types`, `@repo/wagtail-cms-mapping`, `@repo/i18n`) do not need rebuilding.
:::
```

- [ ] **Step 4: Create `apps/docs/docs/getting-started/project-overview.md`**

```markdown
---
sidebar_position: 4
---

# Project overview

## What is this?

The **HSE Multisite Frontend** is a monorepo that powers public-facing websites for the Health Service Executive (HSE) in Ireland. It uses a shared platform architecture: one codebase, multiple sites, all backed by a [Wagtail CMS](https://wagtail.org/) backend.

## Why a monorepo?

- **Shared packages** — CMS client, type definitions, component mappings, i18n, and configuration are shared across all sites
- **Consistent tooling** — One set of linting rules, TypeScript config, test setup, and CI pipeline
- **Atomic changes** — A change to a shared package and the apps that use it can land in a single PR

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| CMS | [Wagtail](https://wagtail.org/) via REST API |
| Design system | `@hseireland/hse-frontend` (CSS/tokens) + `@hseireland/hse-frontend-react` (React components) |
| Monorepo | [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turbo.build/) |
| Language | TypeScript (strict mode) |
| Linting | [Biome](https://biomejs.dev/) v2 |
| Testing | [Vitest](https://vitest.dev/) 4 |
| Validation | [Zod](https://zod.dev/) 4 |

## Workspaces

| Package | Path | Role |
|---|---|---|
| `hse-multisite-template` | `apps/hse-multisite-template` | Next.js app template |
| `@repo/app-config` | `packages/app-config` | Centralised env var validation |
| `@repo/wagtail-api-client` | `packages/wagtail-cms-client` | Wagtail REST client |
| `@repo/wagtail-cms-types` | `packages/wagtail-cms-types` | Zod-based CMS types |
| `@repo/wagtail-cms-mapping` | `packages/wagtail-cms-mapping` | CMS-to-component mapping |
| `@repo/i18n` | `packages/i18n` | Locale routing and translations |
| `@repo/logger` | `packages/logger` | Structured logging |

See [Monorepo Structure](/architecture/monorepo-structure) for details on each package and how they connect.
```

- [ ] **Step 5: Commit**

```bash
git add apps/docs/docs/getting-started/
git commit -m "docs(apps): add Getting Started guide

Cover prerequisites, installation, running locally, and project overview."
```

---

## Task 6: Stub content — Architecture

**Files:**
- Create: `apps/docs/docs/architecture/monorepo-structure.md`
- Create: `apps/docs/docs/architecture/turborepo-pipeline.md`
- Create: `apps/docs/docs/architecture/package-dependency-graph.md`
- Create: `apps/docs/docs/architecture/cms-content-flow.md`
- Create: `apps/docs/docs/architecture/i18n-routing.md`
- Create: `apps/docs/docs/architecture/caching-strategy.md`

- [ ] **Step 1: Create `apps/docs/docs/architecture/monorepo-structure.md`**

```markdown
---
sidebar_position: 1
---

# Monorepo structure

This project uses **pnpm workspaces** for dependency management and **Turborepo** for task orchestration.

## Directory layout

```
hse-multisite-frontend/
├── apps/
│   ├── hse-multisite-template/   # Next.js app
│   └── docs/                     # This documentation site
├── packages/
│   ├── app-config/               # Environment variable validation
│   ├── wagtail-cms-client/       # Wagtail REST API client
│   ├── wagtail-cms-types/        # Zod-based CMS type definitions
│   ├── wagtail-cms-mapping/      # CMS data → React component mapping
│   ├── i18n/                     # Internationalisation
│   ├── logger/                   # Structured logging
│   ├── biome-config/             # Shared Biome linting presets
│   ├── config-typescript/        # Shared tsconfig bases
│   ├── config-vitest/            # Shared Vitest config factory
│   └── commitlint-config/        # Conventional Commits config
├── turbo.json                    # Turborepo pipeline definition
├── pnpm-workspace.yaml           # Workspace + dependency catalog
└── package.json                  # Root scripts and shared dev deps
```

## Package categories

### Apps

Apps are deployable applications. Each app lives in `apps/` and typically depends on several internal packages.

### Runtime packages

These contain the business logic shared across apps:

| Package | Build | Description |
|---|---|---|
| `@repo/app-config` | Source-only | Reads and validates environment variables with Zod |
| `@repo/wagtail-api-client` | bunchee (ESM + CJS) | HTTP client for the Wagtail CMS REST API |
| `@repo/wagtail-cms-types` | Source-only | Zod schemas for all CMS content structures |
| `@repo/wagtail-cms-mapping` | Source-only | Factory that maps CMS data to React components |
| `@repo/i18n` | Source-only | Locale routing middleware, dictionary loading, translation helpers |
| `@repo/logger` | bunchee (ESM + CJS) | Thin console wrapper with structured prefixes |

**Source-only** packages have no build step — their `exports` map points directly at `.ts`/`.tsx` source files. They are transpiled by the consuming app's bundler (Next.js).

**Built** packages (`wagtail-api-client`, `logger`) use [bunchee](https://github.com/huozhi/bunchee) to produce dual ESM + CJS output in `dist/`.

### Config packages

Shared configuration presets that other packages extend:

| Package | Provides |
|---|---|
| `@repo/biome-config` | Biome v2 rule presets (`base`, `next`, `react-internal`) |
| `@repo/typescript-config` | tsconfig bases (`base`, `nextjs`, `react-library`) |
| `@repo/vitest-config` | `createVitestConfig()` factory for Vitest 4 |
| `@repo/commitlint-config` | Conventional Commits rules + allowed scopes |

## Dependency conventions

- Internal packages use `"workspace:*"` protocol
- Shared external versions are defined in the `catalog:` section of `pnpm-workspace.yaml` and referenced as `"catalog:"` in package.json
- HSE design system packages (`@hseireland/*`) come from GitHub Packages
```

- [ ] **Step 2: Create `apps/docs/docs/architecture/turborepo-pipeline.md`**

```markdown
---
sidebar_position: 2
---

# Turborepo pipeline

[Turborepo](https://turbo.build/) orchestrates all build, lint, test, and dev tasks across the monorepo. It understands the dependency graph between packages and runs tasks in the correct order with intelligent caching.

## Defined tasks

The pipeline is configured in `turbo.json` at the repo root:

| Task | Depends on | Outputs | Cached |
|---|---|---|---|
| `build` | `^build` (all dependency builds) | `.next/**`, `dist/**`, `build/**` | Yes |
| `lint` | Nothing | None | Yes |
| `typecheck` | `^build` | None | Yes |
| `test` | `^build` | None | Yes |
| `test:ci` | `^build` | `coverage/**` | Yes |
| `dev` | Nothing | None | No (persistent) |

### Understanding `^build`

The `^` prefix means "run this task in all dependencies first". For example, `typecheck` depends on `^build`, which means:

1. Turborepo looks at the package's dependencies
2. If any dependency has a `build` task, it runs that first
3. Only then does it run `typecheck` for the current package

This ensures that built packages (`wagtail-api-client`, `logger`) produce their `dist/` output before consumers try to type-check against them.

## Running tasks

```bash
# Run across all workspaces
pnpm build
pnpm lint
pnpm test

# Filter to a single workspace
turbo run build --filter=hse-multisite-template
turbo run test --filter=@repo/wagtail-api-client

# Run only affected workspaces (used in CI)
turbo run lint --affected
```

## Caching

Turborepo caches task outputs locally in `.turbo/`. If the inputs (source files, config) haven't changed since the last run, the task is skipped and outputs are restored from cache.

Cache is invalidated by changes to:
- Source files matching the task's `inputs` globs
- `.env*` files (for `build` tasks)
- Dependencies in the workspace graph

In CI, remote caching can be enabled with `TURBO_TOKEN` and `TURBO_TEAM` environment variables.
```

- [ ] **Step 3: Create `apps/docs/docs/architecture/package-dependency-graph.md`**

```markdown
---
sidebar_position: 3
---

# Package dependency graph

This shows how the internal packages depend on each other. Understanding this graph helps you predict which packages are affected when you change something.

## Graph

```
hse-multisite-template (app)
├── @repo/app-config
├── @repo/i18n
├── @repo/logger
├── @repo/wagtail-api-client
│   ├── @repo/logger
│   └── @repo/wagtail-cms-types
├── @repo/wagtail-cms-mapping
│   ├── @repo/wagtail-api-client
│   ├── @repo/wagtail-cms-types
│   └── @hseireland/hse-frontend-react
└── @repo/wagtail-cms-types
```

## Key relationships

- **`wagtail-cms-types`** is the foundation — it defines the Zod schemas that every other CMS package depends on
- **`wagtail-api-client`** uses the types to validate API responses and uses `logger` for error logging
- **`wagtail-cms-mapping`** sits at the top of the CMS stack — it imports both the client and the types to map CMS data to React components
- **`app-config`** and **`i18n`** are independent of the CMS packages — they can be used in any app

## Impact analysis

| If you change... | You also need to check... |
|---|---|
| `wagtail-cms-types` | `wagtail-api-client`, `wagtail-cms-mapping`, the app |
| `wagtail-api-client` | `wagtail-cms-mapping`, the app |
| `wagtail-cms-mapping` | The app |
| `app-config` | The app |
| `i18n` | The app |
| `logger` | `wagtail-api-client`, the app |

Turborepo handles this automatically — `turbo run test --affected` will run tests for everything in the dependency chain.
```

- [ ] **Step 4: Create `apps/docs/docs/architecture/cms-content-flow.md`**

```markdown
---
sidebar_position: 4
---

# CMS content flow

This describes how content travels from the Wagtail CMS backend to a rendered React page.

## The pipeline

```
Wagtail CMS (backend)
    │
    ▼ HTTP REST API
CMSClient.findPageByPath(path)       ← @repo/wagtail-api-client
    │
    ▼ JSON response
Zod schema validation (safeParse)     ← @repo/wagtail-cms-types
    │
    ▼ Typed CMSPageContent
createCMSRenderer(overrides)          ← @repo/wagtail-cms-mapping
    │
    ├── Page layout component          (e.g., ContentPage, LandingPage)
    │   └── Block components           (e.g., BlockText, BlockImage, BlockQuote)
    │       └── HSE design system      ← @hseireland/hse-frontend-react
    │
    ▼ Rendered HTML
Next.js (SSG / ISR)
```

## Step by step

### 1. Fetch

The app's catch-all route (`[lang]/[[...slug]]/page.tsx`) receives the URL path and calls `CMSClient.findPageByPath()`. The client is configured via `@repo/app-config` with the CMS base URL and API path.

### 2. Validate

The API response is validated against Zod schemas from `@repo/wagtail-cms-types`. This uses `safeParse` — if the response doesn't match the schema, a warning is logged (via `@repo/logger`) but the page still renders with whatever data is valid. This prevents a single unexpected field from crashing the page.

### 3. Map

`createCMSRenderer()` from `@repo/wagtail-cms-mapping` returns a `renderPage()` function. It looks up the page type (e.g., `hsebase.ContentPage`) in a registry and renders the corresponding layout component. Each layout iterates over the page's body blocks and renders them using a block registry.

### 4. Render

Block components use React components from `@hseireland/hse-frontend-react` (Details, Button, Promo, etc.) to produce HSE-branded HTML. The result is served by Next.js as either a statically generated page (SSG) or an incrementally regenerated page (ISR).

## Error handling

- **404 from CMS**: `findPageByPath()` returns `NotFoundContents` → the app calls `notFound()` → Next.js renders `not-found.tsx`
- **5xx from CMS**: `FetchError` is thrown → caught by the error boundary → `error.tsx` renders
- **Schema mismatch**: Logged as a warning, page renders with partial data
```

- [ ] **Step 5: Create `apps/docs/docs/architecture/i18n-routing.md`**

```markdown
---
sidebar_position: 5
---

# i18n routing

The monorepo supports multilingual content using the `@repo/i18n` package. Currently, English (`en`) and Irish (`ga`) are configured.

## How locale routing works

The app uses a `[lang]` dynamic route segment at the top of the URL structure:

```
/about/          → English (default locale, prefix hidden)
/ga/about/       → Irish (non-default locale, prefix shown)
```

### Middleware

`createI18nProxy()` from `@repo/i18n` creates a Next.js middleware that:

1. **Detects locale** from the URL prefix
2. **Redirects** requests to `/<defaultLocale>/...` (e.g., `/en/about/`) to `/about/` (removes redundant prefix)
3. **Negotiates** the Accept-Language header for prefix-less URLs to determine the best locale

### Layout

The root layout (`[lang]/layout.tsx`) receives the `lang` param and:
- Loads the correct dictionary via `getDictionary(lang, loaders, defaultLang)`
- Sets `<html lang={lang}>` for accessibility
- Wraps the app in `DictionaryProvider` for client-side translations

## Dictionaries

Translation strings are stored as flat JSON files:

```json title="apps/hse-multisite-template/src/dictionaries/en.json"
{
  "nav.home": "Home",
  "nav.contact": "Contact",
  "items_one": "{count} item",
  "items_other": "{count} items"
}
```

### Loading

`getDictionary()` loads the requested locale and falls back to the default locale for any missing keys. It also unflattens the dotted keys into a nested object for easier consumption.

### Client-side usage

```tsx
"use client";
import { useDictionary } from "@repo/i18n";

export function MyComponent() {
  const dict = useDictionary();
  return <p>{dict.nav.home}</p>;
}
```

### Pluralisation

```tsx
import { plural } from "@repo/i18n";

const label = plural(dict.items, count); // "1 item" or "3 items"
```

Uses `Intl.PluralRules` with CLDR suffixes (`_one`, `_other`, etc.).
```

- [ ] **Step 6: Create `apps/docs/docs/architecture/caching-strategy.md`**

```markdown
---
sidebar_position: 6
---

# Caching strategy

The app uses a three-layer caching strategy to balance performance with content freshness.

## Layer 1: Static generation at build time

`generateStaticParams()` in the catch-all route fetches all published pages from the CMS and pre-renders them at build time. This means the first request to any page is served from static HTML — no server-side rendering needed.

```tsx
export async function generateStaticParams() {
  const pages = await cmsClient.fetchPages({ limit: 1000 });
  // Returns all [lang, ...slug] combinations
}
```

`dynamicParams = true` ensures that pages not returned by `generateStaticParams` (e.g., newly published content) are still rendered on-demand rather than returning 404.

## Layer 2: ISR (Incremental Static Regeneration)

All CMS fetch requests include `next: { revalidate: 3600 }` (1 hour). This means:

- After the first request, the page is cached for 1 hour
- After 1 hour, the next request triggers a background regeneration
- The stale page is served while regeneration happens — no user sees a loading state

This is the safety net: even if the on-demand revalidation webhook fails, content updates within 1 hour.

## Layer 3: On-demand revalidation

The app exposes a `/api/revalidate/` route that accepts webhook calls from Wagtail. When content is published in the CMS:

1. Wagtail sends a POST to `/api/revalidate/` with a token and the updated page path
2. The route validates the `REVALIDATE_TOKEN`
3. It calls `revalidatePath(path)` to purge that specific page from the Next.js cache
4. The next request rebuilds the page with fresh content

This gives near-instant content updates without waiting for the ISR timer.

## Debugging

On `localhost`, `next.config.ts` enables `logging.fetches.fullUrl`, which logs every fetch request with its URL, cache status, and revalidation time. Look for `(cache: HIT)` or `(cache: SKIP)` in the terminal output.
```

- [ ] **Step 7: Commit**

```bash
git add apps/docs/docs/architecture/
git commit -m "docs(apps): add Architecture guide

Cover monorepo structure, Turborepo pipeline, dependency graph,
CMS content flow, i18n routing, and caching strategy."
```

---

## Task 7: Stub content — Packages

**Files:**
- Create: `apps/docs/docs/packages/app-config.md`
- Create: `apps/docs/docs/packages/wagtail-api-client.md`
- Create: `apps/docs/docs/packages/wagtail-cms-types.md`
- Create: `apps/docs/docs/packages/wagtail-cms-mapping.md`
- Create: `apps/docs/docs/packages/i18n.md`
- Create: `apps/docs/docs/packages/logger.md`
- Create: `apps/docs/docs/packages/shared-configs.md`

- [ ] **Step 1: Create `apps/docs/docs/packages/app-config.md`**

```markdown
---
sidebar_position: 1
---

# @repo/app-config

Centralised environment variable validation and typed configuration for all apps.

**Path:** `packages/app-config`
**Build:** Source-only (no build step)

## Usage

```tsx
// Client-safe config (available in Server and Client Components)
import { config } from "@repo/app-config";

console.log(config.cms.baseURL);      // "https://cms.example.com"
console.log(config.environment);       // "localhost" | "dev" | "pre-prod" | "prod"
console.log(config.isProduction);      // boolean
```

```tsx
// Server-only config (secrets — only in Server Components, API routes, middleware)
import { serverConfig } from "@repo/app-config/server";

console.log(serverConfig.previewToken);     // string
console.log(serverConfig.revalidateToken);  // string
```

:::danger
Never import `@repo/app-config/server` in Client Components. It contains secrets that would be bundled into the client JavaScript.
:::

## Configuration shape

### Client config

| Field | Type | Source env var |
|---|---|---|
| `cms.baseURL` | `string` | `NEXT_PUBLIC_CMS_API_ENDPOINT` |
| `cms.apiPath` | `string` | `NEXT_PUBLIC_API_PATH` |
| `environment` | `"localhost" \| "dev" \| "pre-prod" \| "prod"` | `NEXT_PUBLIC_ENVIRONMENT_NAME` |
| `siteUrl` | `string` | `NEXT_PUBLIC_SITEURL` |
| `gtmId` | `string \| undefined` | `NEXT_PUBLIC_GTM_ID` |
| `oneTrustDomainId` | `string \| undefined` | `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` |
| `piwik` | `{ containerId, containerUrl } \| undefined` | `NEXT_PUBLIC_PIWIK_*` |
| `isLocalhost` | `boolean` | Derived |
| `isProduction` | `boolean` | Derived |
| `analyticsEnabled` | `boolean` | Derived |

### Server config

| Field | Type | Source env var |
|---|---|---|
| `previewToken` | `string` | `PREVIEW_TOKEN` |
| `revalidateToken` | `string` | `REVALIDATE_TOKEN` |

## Validation

All environment variables are validated at startup using Zod schemas. If a required variable is missing or invalid, the app fails fast with a clear error message.

In test environments (`NODE_ENV=test`), validation is skipped and safe defaults are returned.

## Design principle

**Never read `process.env` directly in app code.** Always import from `@repo/app-config`. This ensures:
- All env vars are validated at startup
- Types are inferred automatically
- Sensitive values are restricted to server imports
```

- [ ] **Step 2: Create `apps/docs/docs/packages/wagtail-api-client.md`**

```markdown
---
sidebar_position: 2
---

# @repo/wagtail-api-client

HTTP client for the Wagtail CMS REST API.

**Path:** `packages/wagtail-cms-client`
**Build:** bunchee (dual ESM + CJS output in `dist/`)

## Usage

```tsx
import { CMSClient, isNotFound } from "@repo/wagtail-api-client";

const client = new CMSClient({
  baseURL: "https://cms.example.com",
  apiPath: "/api/v2",
});

const page = await client.findPageByPath("/about/");

if (isNotFound(page)) {
  // Handle 404
  console.log(page.message);
} else {
  // page is typed as CMSPageContent
  console.log(page.title);
}
```

## Key methods

| Method | Returns | Description |
|---|---|---|
| `findPageByPath(path)` | `CMSPageContent \| NotFoundContents` | Find a page by its URL path |
| `fetchPage(id)` | `CMSPageContent \| NotFoundContents` | Fetch a page by numeric ID |
| `fetchPages({ type, limit })` | `CMSPaginatedResponse` | List pages with optional type filter |
| `fetchImage(id)` | `CMSImage \| NotFoundContents` | Fetch an image by ID |
| `fetchDocument(id)` | `CMSDocument \| NotFoundContents` | Fetch a document by ID |
| `getMediaSrc(meta)` | `string` | Resolve a media download URL to a full src URL |
| `fetchPagePreview(contentType, token, id)` | `CMSPageContent \| NotFoundContents` | Fetch a preview of an unpublished page |
| `fetchEndpoint<T>(path)` | `T` | Access any arbitrary API endpoint |

## Error handling

The client never throws exceptions for expected HTTP errors. Instead, it returns a `NotFoundContents` object that you distinguish using the `isNotFound()` type guard.

For unexpected failures (network errors, timeouts), the client throws a `FetchError`:

```tsx
import { FetchError } from "@repo/wagtail-api-client";

try {
  const page = await client.findPageByPath("/about/");
} catch (error) {
  if (error instanceof FetchError) {
    console.log(error.code);    // "REQUEST_FAILED" | "UNEXPECTED_ERROR"
    console.log(error.status);  // HTTP status code, or 0 for network errors
  }
}
```
```

- [ ] **Step 3: Create `apps/docs/docs/packages/wagtail-cms-types.md`**

```markdown
---
sidebar_position: 3
---

# @repo/wagtail-cms-types

Zod-based TypeScript type definitions for all Wagtail CMS content structures.

**Path:** `packages/wagtail-cms-types`
**Build:** Source-only (no build step)

## Sub-path exports

| Import path | Contents |
|---|---|
| `@repo/wagtail-cms-types/blocks` | Block type enum, component prop interfaces, value types |
| `@repo/wagtail-cms-types/core` | Client options, API queries, page content, paginated responses |
| `@repo/wagtail-cms-types/page-models` | Page type definitions (ContentPage, LandingPage, etc.) |
| `@repo/wagtail-cms-types/fields` | Common field types (images, CTAs, video, heading levels) |
| `@repo/wagtail-cms-types/settings` | Site settings types (header, footer responses) |
| `@repo/wagtail-cms-types/snippets` | Reusable content snippet types |

## Key types

### Block types

`CMSBlockType` is a string enum of all supported CMS block types:

```tsx
import { CMSBlockType } from "@repo/wagtail-cms-types/blocks";

// CMSBlockType.TEXT = "text"
// CMSBlockType.IMAGE = "image"
// CMSBlockType.RICH_TEXT = "rich_text_block"
// etc.
```

### Page types

```tsx
import type { CMSPageContent, CMSPageType } from "@repo/wagtail-cms-types/core";

// CMSPageType is a union of all page type strings:
// "hsebase.ContentPage" | "hsebase.LandingPage" | "hsebase.CuratedHubPage" | ...
```

### Page models

```tsx
import type { ContentPage, LandingPage } from "@repo/wagtail-cms-types/page-models";
```

## Design principle

All types are defined as Zod schemas first, with TypeScript types inferred using `z.infer<>`. This means the same definition is used for both compile-time type checking and runtime validation.

See the auto-generated [API Reference](/api/wagtail-cms-types) for the complete type catalogue.
```

- [ ] **Step 4: Create `apps/docs/docs/packages/wagtail-cms-mapping.md`**

```markdown
---
sidebar_position: 4
---

# @repo/wagtail-cms-mapping

Maps Wagtail CMS data to React components using a factory pattern with override support.

**Path:** `packages/wagtail-cms-mapping`
**Build:** Source-only (no build step)

## Usage

```tsx
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";

// Use default block and page registries
const { renderPage, renderBlocks } = createCMSRenderer();

// Or provide custom overrides
const { renderPage } = createCMSRenderer({
  blocks: { text: MyCustomTextBlock },
  pages: { "hsebase.ContentPage": MyCustomContentLayout },
});
```

## Block registry

The default block registry maps CMS block types to React components:

| Block type(s) | Component | Design system component |
|---|---|---|
| `text`, `rich_text_block` | `BlockText` | html-react-parser |
| `image` | `BlockImage` | Responsive picture |
| `inset_text` | `BlockInsetText` | `InsetText` |
| `quote` | `BlockQuote` | `BlockQuote` |
| `top_tasks`, `top_task` | `BlockPromo` | `Promo` |
| `links_list_group_v2` | `BlockLinksList` | `LinksList` |
| `action_link` | `BlockActionLink` | `ActionLink` |
| `expander`, `details` | `BlockDetails` | `Details` |
| `expander_group` | `BlockDetailsGroup` | `Details.ExpanderGroup` |
| `button_list` | `BlockButton` | `Button` |
| `content_block_chooser` | `BlockContentBlock` | Recursive renderer |
| `brightcove_video` | `BlockBrightcove` | iframe embed |
| `related_information` | `BlockRelatedInfo` | Semantic HTML |
| `teaser_links` | `BlockTeaserLinks` | `Promo` |

## Page registry

| CMS page type | Layout | Description |
|---|---|---|
| `hsebase.ContentPage` | 2/3 body + optional 1/3 side nav | Standard content pages |
| `hsebase.LandingPage` | Top + body + bottom (full width) | Section landing pages |
| `hsebase.CuratedHubPage` | Body + bottom (2/3 width) | Curated hub pages |
| `hsebase.OrganisationListingPage` | Result count + links | Organisation listings |
| `hsebase.OrganisationLandingPage` | Body + bottom (full width) | Organisation landing pages |

## Sub-path exports

| Import path | Contents |
|---|---|
| `@repo/wagtail-cms-mapping` | `createCMSRenderer` factory |
| `@repo/wagtail-cms-mapping/blocks` | Default block registry + all block components |
| `@repo/wagtail-cms-mapping/pages` | Default page registry + all page layout components |
| `@repo/wagtail-cms-mapping/types` | TypeScript types + type guards (no React dependency) |

## Adding new blocks

See [Adding Block Components](/app-guide/adding-block-components) for a step-by-step guide.
```

- [ ] **Step 5: Create `apps/docs/docs/packages/i18n.md`**

```markdown
---
sidebar_position: 5
---

# @repo/i18n

Locale-aware routing, dictionary loading, and translation helpers for Next.js App Router.

**Path:** `packages/i18n`
**Build:** Source-only (no build step)

## Exports

| Export | Type | Description |
|---|---|---|
| `createI18nProxy(config)` | Middleware factory | Creates locale routing middleware |
| `getDictionary(lang, loaders, defaultLang)` | Async function | Loads and merges dictionaries with fallback |
| `loadDictionary(lang, loaders, defaultLang)` | Async function | Loads flat dictionaries (no unflatten) |
| `DictionaryProvider` | React context provider | Makes dictionary available to client components |
| `useDictionary()` | React hook | Reads dictionary from context |
| `interpolate(template, vars)` | Function | Variable substitution in strings |
| `plural(dict, count)` | Function | Pluralisation using `Intl.PluralRules` |
| `rich(template, factories)` | Function | Rich text tags → React nodes |
| `unflatten(flat)` | Function | Flat dotted keys → nested object |

## Routing behaviour

| URL | Locale | Rule |
|---|---|---|
| `/about/` | `en` (default) | Default locale prefix is hidden |
| `/ga/about/` | `ga` | Non-default locales are prefixed |
| `/en/about/` | Redirects to `/about/` | Redundant default prefix is removed |

See [i18n Routing](/architecture/i18n-routing) for the full architecture explanation.

## Dictionary format

Flat JSON with dotted keys and CLDR plural suffixes:

```json
{
  "nav.home": "Home",
  "items_one": "{count} item",
  "items_other": "{count} items",
  "greeting": "Hello, {name}!"
}
```

## Client-side usage

```tsx
"use client";
import { useDictionary, interpolate, plural } from "@repo/i18n";

export function ItemCount({ count }: { count: number }) {
  const dict = useDictionary();
  return <span>{plural(dict.items, count)}</span>;
}

export function Greeting({ name }: { name: string }) {
  const dict = useDictionary();
  return <p>{interpolate(dict.greeting, { name })}</p>;
}
```
```

- [ ] **Step 6: Create `apps/docs/docs/packages/logger.md`**

```markdown
---
sidebar_position: 6
---

# @repo/logger

Thin structured logging wrapper around `console` methods.

**Path:** `packages/logger`
**Build:** bunchee (dual ESM + CJS output in `dist/`)

## Usage

```tsx
import { log, warn, error } from "@repo/logger";

log("Page rendered", { path: "/about/" });
warn("Schema mismatch", { field: "body", type: "unknown_block" });
error("CMS fetch failed", { status: 500, url: "/api/v2/pages/" });
```

## API

| Function | Maps to | Output prefix |
|---|---|---|
| `log(...args)` | `console.log` | `LOGGER: ` |
| `warn(...args)` | `console.warn` | `LOGGER: ` |
| `error(...args)` | `console.error` | `LOGGER: ` |

## Why use this instead of `console.log`?

- **Consistent prefix** makes it easy to grep logs in production
- **Single import point** allows future extension (e.g., sending logs to an external service) without changing call sites
- **Explicit severity levels** distinguish informational messages from warnings and errors
```

- [ ] **Step 7: Create `apps/docs/docs/packages/shared-configs.md`**

```markdown
---
sidebar_position: 7
---

# Shared configuration packages

These packages provide reusable configuration presets for tooling across the monorepo.

## @repo/biome-config

**Path:** `packages/biome-config`

Shared [Biome v2](https://biomejs.dev/) presets for linting and formatting.

| Preset | Use case | Extends |
|---|---|---|
| `base.json` | Any TypeScript package | — |
| `next.json` | Next.js apps | `base.json` + React/Next rules |
| `react-internal.json` | Internal React libraries | `base.json` + React rules |

Usage in a package's `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.9/schema.json",
  "extends": ["@repo/biome-config/base"]
}
```

**Key settings:** Tabs, indent-width 2, double quotes, import organisation via Biome Assist.

## @repo/typescript-config

**Path:** `packages/config-typescript`

Shared tsconfig base files.

| Config | Use case | Key settings |
|---|---|---|
| `base.json` | Any TypeScript package | Strict mode, ESNext module, bundler resolution |
| `nextjs.json` | Next.js apps | Adds JSX preserve, DOM libs, incremental |
| `react-library.json` | React libraries | Adds JSX react-jsx, ES2015 lib |

Usage:

```json
{
  "extends": "@repo/typescript-config/base.json"
}
```

## @repo/vitest-config

**Path:** `packages/config-vitest`

Factory function for creating Vitest 4 configurations:

```ts
import { createVitestConfig } from "@repo/vitest-config";

export default createVitestConfig({
  environment: "jsdom",       // or "node" for server packages
  setupFile: "./vitest.setup.ts",
  include: ["src/**"],
});
```

**Provides:** Vitest, jsdom, @vitest/coverage-v8 — don't add these separately.

## @repo/commitlint-config

**Path:** `packages/commitlint-config`

Enforces [Conventional Commits](https://www.conventionalcommits.org/) via a Husky `commit-msg` hook.

**Format:** `<type>(<scope>): <subject>`

**Allowed scopes:** `apps`, `packages`, `configs`, `gh-actions`, `deps`, `deps-dev`

```bash
# Valid commits
feat(apps): add Irish language support
fix(packages): handle missing CMS response fields
chore(deps): upgrade Next.js to 16.3
docs(apps): update README with Docker instructions
```
```

- [ ] **Step 8: Commit**

```bash
git add apps/docs/docs/packages/
git commit -m "docs(apps): add Packages guide

Document app-config, wagtail-api-client, wagtail-cms-types,
wagtail-cms-mapping, i18n, logger, and shared config packages."
```

---

## Task 8: Stub content — App Guide

**Files:**
- Create: `apps/docs/docs/app-guide/app-structure.md`
- Create: `apps/docs/docs/app-guide/routing.md`
- Create: `apps/docs/docs/app-guide/layouts-and-error-boundaries.md`
- Create: `apps/docs/docs/app-guide/cms-page-rendering.md`
- Create: `apps/docs/docs/app-guide/adding-block-components.md`
- Create: `apps/docs/docs/app-guide/adding-page-types.md`
- Create: `apps/docs/docs/app-guide/analytics-integration.md`
- Create: `apps/docs/docs/app-guide/seo-and-metadata.md`
- Create: `apps/docs/docs/app-guide/security-headers.md`

> **Note to implementer:** These pages follow the same pattern as the Getting Started and Architecture sections. Each page should have `sidebar_position` frontmatter and cover the topic using the source code in `apps/hse-multisite-template/` as the authoritative reference. The content below provides the structure and key points for each page. Write the full content by reading the relevant source files.

- [ ] **Step 1: Create all App Guide pages**

Create each file with the following structure. Each file needs `sidebar_position` frontmatter (1-9 in order) and should cover:

**`app-structure.md`** (position 1): Directory layout of `apps/hse-multisite-template/src/`, role of each directory (`app/`, `components/`, `lib/`, `styles/`, `dictionaries/`), key files.

**`routing.md`** (position 2): The `[lang]/[[...slug]]` catch-all pattern, how `generateStaticParams` works, `dynamicParams = true`, how the slug maps to CMS paths.

**`layouts-and-error-boundaries.md`** (position 3): Root layout (`[lang]/layout.tsx`) responsibilities (HTML shell, header/footer, scripts, i18n provider), `error.tsx` boundary, `not-found.tsx`, `global-error.tsx`.

**`cms-page-rendering.md`** (position 4): How `page.tsx` fetches CMS data, calls `createCMSRenderer`, and renders the result. The full flow from URL to rendered page.

**`adding-block-components.md`** (position 5): Step-by-step guide: define Zod schema in `wagtail-cms-types`, add enum value to `CMSBlockType`, create React component in `wagtail-cms-mapping`, register in block registry, test.

**`adding-page-types.md`** (position 6): Step-by-step guide: define page model schema, add to `CMSPageType`, create layout component, register in page registry, test.

**`analytics-integration.md`** (position 7): How GTM, OneTrust, and Piwik Pro are conditionally loaded based on `@repo/app-config`, how `config.isLocalhost` gates them, the script components in `components/scripts/`.

**`seo-and-metadata.md`** (position 8): `generatePageMetadata` from `@repo/wagtail-cms-mapping`, how it maps CMS fields (`seo_title`, `search_description`) to Next.js `Metadata`, `robots.ts`, `sitemap.ts`, canonical URLs.

**`security-headers.md`** (position 9): The `security-headers.ts` file, CSP construction, how domains are added dynamically based on configured integrations.

- [ ] **Step 2: Commit**

```bash
git add apps/docs/docs/app-guide/
git commit -m "docs(apps): add App Guide

Cover app structure, routing, layouts, CMS rendering, adding blocks
and page types, analytics, SEO, and security headers."
```

---

## Task 9: Stub content — Deployment

**Files:**
- Create: `apps/docs/docs/deployment/environment-variables.md`
- Create: `apps/docs/docs/deployment/docker-build.md`
- Create: `apps/docs/docs/deployment/ci-cd-pipeline.md`
- Create: `apps/docs/docs/deployment/github-pages-docs.md`
- Create: `apps/docs/docs/deployment/troubleshooting.md`

- [ ] **Step 1: Create all Deployment pages**

**`environment-variables.md`** (position 1): Full reference table of every environment variable — name, required/optional, build-time vs runtime, default value, description. Split into `NEXT_PUBLIC_*` (build args) and server-only (runtime) sections. Include a sample `.env.local` file.

**`docker-build.md`** (position 2): Walk through each of the 4 Dockerfile stages (pruner, deps, builder, runner). Explain `turbo prune --docker`, the NPM_TOKEN secret, build args, standalone output, and the minimal runner image. Include the full `docker build` command with all required args.

**`ci-cd-pipeline.md`** (position 3): Explain the PR workflow (`.github/workflows/pr.yml`): what triggers it, the 5 parallel jobs (lint, typecheck, test, build, report), how the setup action works, how the consolidated PR comment is assembled. Mention `TURBO_TOKEN`/`TURBO_TEAM` for remote caching.

**`github-pages-docs.md`** (position 4): How this docs site is deployed — the `docs.yml` workflow, trigger paths, build command, `actions/deploy-pages`. How to update the `url`/`baseUrl` when the repo moves.

**`troubleshooting.md`** (position 5): Common deployment issues and solutions: npm token failures, build arg vs runtime env confusion, standalone output missing files, Docker build context issues, cache invalidation not working.

- [ ] **Step 2: Commit**

```bash
git add apps/docs/docs/deployment/
git commit -m "docs(apps): add Deployment guide

Cover environment variables, Docker build, CI/CD pipeline,
GitHub Pages deployment, and troubleshooting."
```

---

## Task 10: Stub content — Onboarding Sites

**Files:**
- Create: `apps/docs/docs/onboarding-sites/index.md`

- [ ] **Step 1: Create placeholder page**

```markdown
---
sidebar_position: 1
sidebar_label: "Overview"
---

# Onboarding new sites

:::info Coming soon
This section will be populated once the site templating workflow is established. It will cover:

- **Creating a new app** from the `hse-multisite-template`
- **Configuration checklist** for the new site
- **CMS setup** — connecting to a Wagtail instance
- **DNS & routing** — domain configuration
- **Go-live checklist** — final verification steps
:::

In the meantime, the process involves duplicating `apps/hse-multisite-template` into a new `apps/<site-name>` directory and adjusting the configuration. See [Environment Variables](/deployment/environment-variables) for the configuration each site needs.
```

- [ ] **Step 2: Commit**

```bash
git add apps/docs/docs/onboarding-sites/
git commit -m "docs(apps): add Onboarding Sites placeholder

Add landing page for future site onboarding documentation."
```

---

## Task 11: GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/docs.yml`

- [ ] **Step 1: Create `.github/workflows/docs.yml`**

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - "apps/docs/**"
      - "packages/*/src/**"
      - ".github/workflows/docs.yml"

  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    name: Build docs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ./.github/actions/setup
        with:
          node-auth-token: ${{ secrets.NPM_TOKEN }}

      - name: Build docs site
        run: pnpm exec turbo run build --filter=docs

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: apps/docs/build

  deploy:
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/docs.yml
git commit -m "ci(gh-actions): add GitHub Pages deployment workflow

Deploy docs site on push to main when docs or package source changes.
Uses actions/deploy-pages with Turborepo build."
```

---

## Task 12: Build verification and lint check

- [ ] **Step 1: Run lint on the docs workspace**

Run: `cd apps/docs && pnpm lint`
Expected: No errors. Biome auto-fixes any formatting issues.

- [ ] **Step 2: Run typecheck on the docs workspace**

Run: `cd apps/docs && pnpm typecheck`
Expected: No type errors.

- [ ] **Step 3: Build the docs site**

Run: `pnpm exec turbo run build --filter=docs`
Expected: Docusaurus builds successfully. Output in `apps/docs/build/`. TypeDoc generates API reference pages in `apps/docs/docs/api/`.

- [ ] **Step 4: Preview the built site locally**

Run: `cd apps/docs && pnpm serve`
Expected: Site served at `http://localhost:3000/hse-multisite-frontend/`. Navigate and verify:
- HSE branding (purple primary, HSE logo, footer)
- Getting Started, Architecture, Packages, App Guide, Deployment sections in sidebar
- API Reference sidebar with auto-generated content
- Dark mode toggle works

- [ ] **Step 5: Add generated API docs to .gitignore**

Create `apps/docs/.gitignore`:

```
# TypeDoc auto-generated API reference (regenerated on build)
docs/api/

# Docusaurus build output
build/
.docusaurus/
```

- [ ] **Step 6: Commit**

```bash
git add apps/docs/.gitignore
git commit -m "chore(apps): add docs .gitignore for generated files

Exclude TypeDoc API output and Docusaurus build artifacts from git."
```

---

## Task 13: Final verification

- [ ] **Step 1: Run the full monorepo pipeline**

Run: `pnpm build && pnpm lint && pnpm typecheck`
Expected: All workspaces pass, including `docs`.

- [ ] **Step 2: Verify .dockerignore works**

Run: `grep "apps/docs" .dockerignore`
Expected: Shows the `apps/docs` exclusion line.

- [ ] **Step 3: Verify the dev server**

Run: `turbo run dev --filter=docs`
Expected: Docusaurus dev server starts at `http://localhost:3000/hse-multisite-frontend/` with hot reload.

- [ ] **Step 4: Final commit (if any remaining changes)**

```bash
git status
# If there are remaining changes, stage and commit them
```
