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
```

If no Makefile target exists yet, manually scaffold based on `apps/hse-app-template/`.

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
