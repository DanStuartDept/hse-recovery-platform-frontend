---
name: Conventional Commits
description: Commit message format enforced by commitlint in this monorepo
---

# Conventional Commits

This monorepo enforces commit messages via `@repo/commitlint-config` (extends `@commitlint/config-conventional`).

## Format

```
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
