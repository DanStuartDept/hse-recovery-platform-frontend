---
description: "TypeScript conventions for this pnpm + Turborepo monorepo. Biome formatting, strict mode, workspace protocols."
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Conventions

- **Strict mode** everywhere. Never use `any` — use `unknown` and narrow, or define a proper type.
- **Biome v2** for linting and formatting (no ESLint). Tabs, indent-width 2, line-width 120.
- Run `pnpm lint` (Biome check --write) before committing.
- Prefer **named exports**. Use `type` keyword for type-only imports: `import type { Foo } from "..."`.

## Monorepo Dependencies

- Internal packages: `"workspace:*"` protocol in `package.json`.
- External versions: `"catalog:"` referencing `pnpm-workspace.yaml` catalog — never pin versions directly in `package.json`.

## Library Package Imports

- `@repo/wagtail-api-client` and `@repo/logger`: built with bunchee. TypeScript imports **must use `.js` extensions** (e.g., `import { foo } from "./lib/index.js"`).
- `@repo/wagtail-cms-types`: source-only — no build step, exports raw `.ts` files. Import via sub-path: `@repo/wagtail-cms-types/core`, `/blocks`, `/fields`, `/page-models`, `/settings`, `/snippets`.
