---
sidebar_position: 3
---

# CI/CD Pipeline

## Overview

The CI pipeline is defined in `.github/workflows/pr.yml`. It runs on every pull request targeting `main` (on `opened`, `synchronize`, and `reopened` events). All jobs require `pull-requests: write` permission to post the consolidated PR comment.

## Jobs

The four check jobs run in parallel:

| Job | Command | What it checks |
|---|---|---|
| **Lint** | `turbo run lint --affected` | Biome formatting and lint rules |
| **Typecheck** | `turbo run typecheck --affected` | TypeScript strict mode across the workspace |
| **Test** | `turbo run test:ci --affected` | Vitest unit tests with coverage |
| **Build** | `turbo run build --affected` | Full production build of changed packages and apps |

All four jobs use `--affected`, which tells Turborepo to only run tasks for packages that have changed relative to the `main` branch. This keeps CI fast on large PRs that only touch a subset of the monorepo.

A fifth **Report** job runs after all four complete (with `if: always()` so it runs even when jobs fail). It downloads the Markdown artefacts produced by each job and assembles them into a single PR comment.

## The setup action

Each job uses the shared composite action at `.github/actions/setup/action.yml`. It performs four steps in order:

1. **Fetch the base branch** — `git fetch origin main:main --depth=1`. This is required so that `--affected` has a reference to compare against.
2. **Install pnpm** — via `pnpm/action-setup@v5`, which reads the version from the `packageManager` field in `package.json`.
3. **Setup Node.js** — via `actions/setup-node@v6`, reading the Node version from `.nvmrc`. The `cache: "pnpm"` option restores the pnpm store cache between runs.
4. **Install dependencies** — `pnpm install --frozen-lockfile`. The `NPM_TOKEN` secret is forwarded via `NODE_AUTH_TOKEN`, which `actions/setup-node` configures as the auth token for the GitHub Packages registry.

The `node-auth-token` input is required by the setup action. Each job passes `${{ secrets.NPM_TOKEN }}` — this is the same GitHub Personal Access Token (with `read:packages` scope) used for local development.

## PR comment

Each job captures its command output and writes a small Markdown fragment to a file (`lint.md`, `typecheck.md`, `coverage.md`, `build.md`). These are uploaded as workflow artefacts via `actions/upload-artifact@v7`.

The **Report** job downloads all four artefacts, concatenates them under a `## CI Report` heading (prefixed with the HTML comment `<!-- ci-report -->`), and posts the result as a PR comment using `peter-evans/create-or-update-comment@v5`.

The `body-includes: "<!-- ci-report -->"` option tells the action to look for an existing comment containing that marker and update it in place (`edit-mode: replace`) rather than posting a new comment on every push. This keeps the PR timeline clean.

If a job fails, its section in the comment collapses the raw output into a `<details>` block so the summary is visible at a glance.

## Turborepo remote cache

Both `TURBO_TOKEN` and `TURBO_TEAM` are set as workflow-level environment variables:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

When these are present, Turborepo uploads task outputs (build artefacts, test results) to a remote cache. Subsequent CI runs — and local developer machines — that run the same task on the same inputs will restore from cache rather than rerunning the task. This dramatically reduces CI time for unchanged packages.

`TURBO_TOKEN` is a repository secret; `TURBO_TEAM` is a repository variable (non-secret). Both are configured in **Settings → Secrets and variables → Actions** in the GitHub repository. If neither is configured the pipeline still works correctly — it just does not benefit from remote caching.

## Required GitHub secrets and variables

| Name | Type | Purpose |
|---|---|---|
| `NPM_TOKEN` | Secret | GitHub PAT with `read:packages` for installing `@hseireland` packages |
| `TURBO_TOKEN` | Secret | Turborepo remote cache authentication token |
| `TURBO_TEAM` | Variable | Turborepo team slug for cache scoping |
