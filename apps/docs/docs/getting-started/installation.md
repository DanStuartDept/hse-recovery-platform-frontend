---
sidebar_position: 2
---

# Installation

This guide walks you through cloning the repository and getting a full build running locally from scratch.

## 1. Clone the repository

```bash
git clone git@github.com:hseireland/hse-multisite-frontend.git
cd hse-multisite-frontend
```

## 2. Enable Corepack

If you have not already enabled Corepack on your machine, do it now:

```bash
corepack enable
```

This tells Node.js to use the pnpm version declared in `packageManager` (`pnpm@10.33.0`) whenever you run `pnpm` inside this repo. You only need to run this once per machine.

## 3. Export your NPM_TOKEN

The `@hseireland` design-system packages are hosted on GitHub Packages and require authentication. Before installing dependencies, make sure `NPM_TOKEN` is set in your shell:

```bash
export NPM_TOKEN=ghp_your_token_here
```

If you add this to your shell profile (e.g. `~/.zshrc`), you will not need to repeat this step. See [Prerequisites](./prerequisites.md) for how to obtain the token.

## 4. Install dependencies

From the repo root:

```bash
pnpm install
```

pnpm reads `pnpm-workspace.yaml` and installs all dependencies for every package and app in the monorepo into a single shared store. The lockfile (`pnpm-lock.yaml`) is committed — installs are deterministic.

## 5. Build the monorepo

```bash
pnpm build
```

Turborepo runs `build` across all workspaces in dependency order (`dependsOn: ["^build"]`). Two packages produce compiled output:

- `@repo/wagtail-api-client` (`packages/wagtail-cms-client`) — built to `dist/` via bunchee (ESM + CJS)
- `@repo/logger` (`packages/logger`) — built to `dist/` via bunchee (ESM + CJS)

All other packages are source-only and are transpiled by their consumer at build time. The Next.js app (`hse-multisite-template`) is also built as part of this step.

Build artefacts are cached by Turborepo locally in `.turbo/`. Subsequent builds only rebuild packages whose inputs have changed.

> **First build is slower.** Subsequent runs benefit from Turborepo's local cache. If the remote Turborepo cache is configured, CI and team members share cached outputs.

## 6. Verify the installation

Run these three checks in sequence:

```bash
# Type-check all workspaces (requires built packages)
pnpm typecheck

# Lint all TypeScript/TSX files with Biome
pnpm lint

# Run all tests (requires built packages)
pnpm test
```

All three should exit with code 0. If `typecheck` or `test` fail with module-not-found errors, the built packages are likely stale — run `pnpm build` again.

## Troubleshooting

**`401 Unauthorized` during install**

Your `NPM_TOKEN` is missing or has expired. Verify `echo $NPM_TOKEN` prints a value, and confirm the token has the `read:packages` scope on GitHub.

**Wrong pnpm version warning**

Make sure Corepack is enabled (`corepack enable`) and that you are not using a globally installed pnpm that takes precedence. Run `which pnpm` — it should point to a Corepack-managed shim, not `/usr/local/bin/pnpm` or similar.

**Type errors after switching branches**

The built packages (`wagtail-api-client`, `logger`) may be out of date. Run `pnpm build` to rebuild them before running `pnpm typecheck`.

**`NEXT_PUBLIC_CMS_API_ENDPOINT` not set error on build**

The Next.js app requires several environment variables at build time. Copy the example file and fill in values:

```bash
cp apps/hse-multisite-template/.env.example apps/hse-multisite-template/.env.local
```

See [Running Locally](./running-locally.md) for the full list of variables and their purpose.
