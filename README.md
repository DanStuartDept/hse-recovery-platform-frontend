# HSE Multisite Frontend

A **pnpm + Turborepo monorepo** containing the HSE Multisite frontend. The primary Next.js application integrates with a **Wagtail CMS** backend.

## Prerequisites

- Node.js >= 24
- pnpm 10 (pinned via `packageManager` field)

## Getting Started

Install all workspace dependencies from the repo root:

```sh
pnpm install
```

## What's Inside?

### Apps

- **`apps/hse-multisite-template`** (`hse-multisite-template`): [Next.js](https://nextjs.org/) 16 application (React 19, App Router). Uses the [HSE Ireland design system](https://github.com/HSEIreland) and fetches content via the Wagtail API client.

### Packages

- **`packages/app-config`** (`@repo/app-config`): Centralised env var validation and typed config. Source-only.
- **`packages/wagtail-cms-client`** (`@repo/wagtail-api-client`): Wagtail REST API client — `CMSClient` class and `fetchContent` helpers. Built with bunchee (dual ESM + CJS output).
- **`packages/wagtail-cms-types`** (`@repo/wagtail-cms-types`): Zod-based TypeScript types for all Wagtail content. Source-only (no build step). Sub-path exports: `/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
- **`packages/wagtail-cms-mapping`** (`@repo/wagtail-cms-mapping`): CMS-to-component mapping with factory pattern. Source-only.
- **`packages/i18n`** (`@repo/i18n`): Locale routing, dictionary loading, and translation helpers. Source-only.
- **`packages/logger`** (`@repo/logger`): Thin `console.log` wrapper for standardised logging.
- **`packages/config-vitest`** (`@repo/vitest-config`): Shared `createVitestConfig()` factory for Vitest 4.
- **`packages/biome-config`** (`@repo/biome-config`): Shared [Biome](https://biomejs.dev/) rule sets.
- **`packages/config-typescript`** (`@repo/typescript-config`): Shared `tsconfig` bases (`base.json`, `nextjs.json`, etc.).
- **`packages/commitlint-config`** (`@repo/commitlint-config`): Shared Conventional Commits config for commitlint.

## Development

Start all dev servers (persistent, no Turbo cache):

```sh
pnpm dev
```

Run a specific app only:

```sh
turbo run dev --filter=hse-multisite-template
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Building

Build all packages and apps in dependency order:

```sh
pnpm build
```

## Testing

```sh
pnpm test          # vitest run (all packages)
pnpm test:ci       # vitest run --coverage
```

## Linting & Formatting

```sh
pnpm lint          # biome check --write (auto-fixes .ts/.tsx)
pnpm format        # prettier --write (Markdown files only)
pnpm typecheck     # tsc --noEmit across workspace
```

## Docker

> **Important:** Docker builds must be run from the **monorepo root** — the build context needs access to all workspace packages.

Each app has its own `Dockerfile`. Build with:

```sh
NPM_TOKEN="$(grep '//npm.pkg.github.com/:_authToken=' ~/.npmrc | cut -d= -f2)" \
docker build \
  -f apps/hse-multisite-template/Dockerfile \
  --secret id=NPM_TOKEN \
  --build-arg NEXT_PUBLIC_CMS_API_ENDPOINT=https://dev.cms.hse.ie \
  --build-arg NEXT_PUBLIC_API_PATH=/api/v2 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT_NAME=dev \
  --build-arg NEXT_PUBLIC_SITEURL=https://dev.hse.ie \
  --build-arg NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS=assets.hse.ie \
  -t hse-multisite-template .
```

Run the container:

```sh
docker run -p 3000:3000 hse-multisite-template
```

See each app's README for the full list of build args and runtime env vars.

## Tools

- [Turborepo](https://turborepo.com/) — monorepo task orchestration
- [Next.js](https://nextjs.org/) 16 — App Router, React 19

- [Biome](https://biomejs.dev/) v2 — linting and formatting (no ESLint)
- [Vitest](https://vitest.dev/) 4 — unit testing
- [Zod](https://zod.dev/) — runtime validation and type generation
- [react-hook-form](https://react-hook-form.com/) — form management
