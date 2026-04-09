---
sidebar_position: 2
---

# Turborepo Pipeline

[Turborepo](https://turborepo.dev) orchestrates tasks across the monorepo workspaces. It understands the dependency graph between packages and:

- Runs tasks in topological order (dependencies first)
- Caches task outputs locally in `.turbo/` — unchanged packages are skipped entirely
- Enables parallel execution where there are no ordering constraints

All configuration lives in `turbo.json` at the repository root.

---

## Task definitions

### `build`

```json
{
  "dependsOn": ["^build"],
  "inputs": ["$TURBO_DEFAULT$", ".env*"],
  "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"]
}
```

**`^build`** means: run `build` in every dependency of this workspace before running `build` here. In practice this ensures that `@repo/logger` and `@repo/wagtail-api-client` (both compiled by bunchee to `dist/`) are built before any package that imports them — TypeScript resolves those packages via their `dist/es/index.js` entry point, so a stale or missing `dist/` causes immediate compile failures.

Inputs include `.env*` files in addition to the default file set (`$TURBO_DEFAULT$`), because environment variable changes can alter the compiled output of the Next.js app.

Cached outputs are the `.next/` directory (excluding the cache subdirectory) and any `dist/` or `build/` directories. Turborepo restores these on a cache hit, which makes subsequent builds in CI extremely fast.

### `lint`

```json
{
  "dependsOn": [],
  "inputs": ["src/**", "*.json", "*.ts", "*.js"]
}
```

No upstream dependencies — lint tasks for every package can run in parallel. The linter is **Biome v2** (`biome check --write`). Running `pnpm lint` from the repo root auto-fixes all `.ts` and `.tsx` files across the workspace.

Lint has no declared `outputs`, so Turborepo caches whether the task passed but does not restore any files.

### `typecheck`

```json
{
  "dependsOn": ["^build"],
  "inputs": ["src/**", "*.json", "*.ts"]
}
```

Depends on `^build` for the same reason as `build` — `tsc --noEmit` needs the compiled type declarations from `@repo/logger` and `@repo/wagtail-api-client`. No outputs are declared because type checking produces no artefacts.

### `test`

```json
{
  "dependsOn": ["^build"],
  "outputs": []
}
```

Depends on `^build`. The test runner is **Vitest 4**. No outputs are declared (no coverage artefacts). Tests run in the `jsdom` environment by default; server-only packages pass `environment: 'node'` to `createVitestConfig()`.

### `test:ci`

```json
{
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"]
}
```

Same as `test` but runs with `--coverage`. The `coverage/` directory is declared as an output so Turborepo caches and restores coverage reports on a cache hit, avoiding redundant test runs in CI.

### `dev`

```json
{
  "cache": false,
  "persistent": true
}
```

`cache: false` — dev servers must never be served from cache. `persistent: true` — Turborepo treats these as long-running processes rather than one-shot tasks, which allows the Terminal UI (`"ui": "tui"`) to display live output from multiple servers simultaneously.

`dev` has no `dependsOn`, so it starts all dev servers in the workspace in parallel (Next.js app, docs site, and any package that declares a `dev` script such as the bunchee watchers).

---

## Running tasks

### Full workspace

```bash
pnpm build        # build all packages and apps in dependency order
pnpm test         # run all tests (requires a prior build)
pnpm lint         # lint and auto-fix all workspaces in parallel
pnpm typecheck    # type-check all workspaces
pnpm dev          # start all dev servers (persistent, no cache)
pnpm test:ci      # run all tests with coverage
```

### Filtered to a single workspace

Use the `--filter` flag to scope a task to one package or app:

```bash
# Start only the Next.js app
turbo run dev --filter=hse-multisite-template

# Run tests for a specific package
turbo run test --filter=@repo/wagtail-api-client

# Build only the logger package and anything that depends on it
turbo run build --filter=@repo/logger...

# Build everything that @repo/wagtail-cms-mapping depends on
turbo run build --filter=...@repo/wagtail-cms-mapping
```

The `...` suffix (or prefix) means "include dependents" (or "include dependencies"). Omit it to target only the named workspace.

### Running a single test file

For rapid feedback during development, bypass Turborepo and call Vitest directly from the package directory:

```bash
cd packages/wagtail-cms-client
pnpm vitest run src/lib/fetchContent.test.ts
```

---

## How caching works

Turborepo computes a hash for each task from:

1. The task inputs (source files, config files, `.env*` as declared in `turbo.json`)
2. The hash of the task's upstream dependencies' outputs
3. Environment variable values listed in `globalEnv` or task-level `env`

If the hash matches a previous run, the task is a **cache hit**: Turborepo replays the terminal output and restores declared outputs from the local cache (`.turbo/` in the repo root). If not, the task runs and its result is stored.

Local cache is sufficient for individual developers. For CI environments and team-wide sharing, a **remote cache** eliminates redundant work across machines.

---

## Remote caching

Turborepo supports remote caching via the Vercel Remote Cache or a self-hosted alternative. Configure it with two environment variables:

| Variable | Purpose |
|---|---|
| `TURBO_TOKEN` | API token authenticating upload/download access to the remote cache |
| `TURBO_TEAM` | Team or organisation slug that scopes the cache namespace |

Set these in your CI environment (e.g., GitHub Actions secrets):

```bash
# In CI
TURBO_TOKEN=your_token
TURBO_TEAM=your-team-slug
```

Once set, any task output already computed by another CI run (or a team member's local build) is restored from the remote cache without re-executing the task. This is particularly valuable for the `build` task in pull-request pipelines where the base branch is already built.

To link a local development machine to the remote cache, run:

```bash
npx turbo login
npx turbo link
```

---

## Terminal UI

`turbo.json` sets `"ui": "tui"`, which activates Turborepo's interactive terminal UI. During `pnpm dev` it renders a split-pane view of all persistent dev server outputs. Press `q` to quit all processes simultaneously.
