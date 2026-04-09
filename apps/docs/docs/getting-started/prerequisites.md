---
sidebar_position: 1
---

# Prerequisites

Before you can work with this monorepo, make sure the following tools and access are in place.

## Node.js

**Required: Node.js >= 24**

The `engines` field in the root `package.json` enforces this constraint. Node 24 is the minimum because several workspace packages rely on stable native APIs first stabilised in that release line.

Check your version:

```bash
node --version
```

If you need to manage multiple Node versions, [Volta](https://volta.sh/) and [nvm](https://github.com/nvm-sh/nvm) both work well.

## pnpm via Corepack

**Required: pnpm 10.33.0 (exact)**

The `packageManager` field in `package.json` pins the exact pnpm version. Corepack (bundled with Node.js >= 16) enforces this automatically when you run any `pnpm` command inside the repo.

Enable Corepack once on your machine:

```bash
corepack enable
```

After that, any `pnpm` invocation in this repo will use exactly 10.33.0 — Corepack downloads it automatically if it is not cached.

> **Do not** install pnpm globally via `npm install -g pnpm` or Homebrew for use with this project. Corepack is the canonical way to pin the version, and a mismatched pnpm version can corrupt the lockfile.

## Git

Any recent Git version (2.x) will do. The repo uses Husky for pre-commit hooks (Biome lint + Conventional Commits via commitlint).

## GitHub Packages access (NPM_TOKEN)

The HSE design-system packages are published to GitHub Packages under the `@hseireland` scope:

- `@hseireland/hse-frontend` — CSS design tokens and base styles
- `@hseireland/hse-frontend-react` — React component library

The `.npmrc` at the repo root configures the registry:

```
@hseireland:registry=https://npm.pkg.github.com
```

GitHub Packages requires authentication even for read access. You need a **GitHub Personal Access Token (classic)** with at minimum the `read:packages` scope.

Once you have the token, expose it as an environment variable before running `pnpm install`:

```bash
export NPM_TOKEN=ghp_your_token_here
```

Or add it permanently to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.). The `.npmrc` picks it up via the `${NPM_TOKEN}` interpolation that GitHub Packages convention expects. Ask a team member for access if you do not already have a token with the correct scope.

> Docker builds also require this token. It is passed as a Docker build secret — see the Docker guide for details.

## Editor setup

### VS Code

Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) (`biomejs.biome`). Add the following to your workspace or user `settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

**Disable ESLint and Prettier for TypeScript/TSX files.** This project uses Biome v2 for both linting and formatting — running ESLint or Prettier alongside it will cause conflicts. Markdown files are formatted by Prettier (via `pnpm format`), so you can keep Prettier active for `.md` files if you wish.

### Other editors

JetBrains IDEs have a [Biome plugin](https://plugins.jetbrains.com/plugin/22761-biome). Neovim users can integrate via the [biome LSP](https://biomejs.dev/reference/lsp/).

## Summary checklist

| Requirement | How to verify |
|---|---|
| Node >= 24 | `node --version` |
| Corepack enabled | `corepack --version` |
| pnpm 10.33.0 | `pnpm --version` (inside repo) |
| Git | `git --version` |
| `NPM_TOKEN` set | `echo $NPM_TOKEN` |
| Biome editor extension installed | Check extension list in your editor |
