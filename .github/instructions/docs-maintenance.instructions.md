---
description: "Keep the Docusaurus documentation site in sync when changing package APIs, types, architecture, or configuration."
applyTo: "packages/**,apps/docs/**"
---

# Documentation Maintenance

The project has a Docusaurus documentation site at `apps/docs/` with hand-authored guides and auto-generated API reference.

## When to update docs

If you are changing any of the following, check whether the corresponding doc needs updating:

| What changed | Doc to check |
|---|---|
| Package public API or exports | `apps/docs/docs/packages/<package-name>.md` |
| Zod schemas or CMS types | `apps/docs/docs/packages/wagtail-cms-types.md` |
| CMSClient methods or options | `apps/docs/docs/packages/wagtail-api-client.md` |
| Block or page type registries | `apps/docs/docs/packages/wagtail-cms-mapping.md` |
| App config env vars | `apps/docs/docs/packages/app-config.md` and `apps/docs/docs/deployment/environment-variables.md` |
| i18n routing or dictionaries | `apps/docs/docs/packages/i18n.md` and `apps/docs/docs/architecture/i18n-routing.md` |
| Caching or ISR strategy | `apps/docs/docs/architecture/caching-strategy.md` |
| CMS content flow | `apps/docs/docs/architecture/cms-content-flow.md` |
| Docker or deployment config | `apps/docs/docs/deployment/` |
| New package or workspace | Workspace table in `CLAUDE.md`, `.github/copilot-instructions.md`, and `apps/docs/docs/architecture/monorepo-structure.md` |

## API reference (auto-generated)

TypeDoc API reference in `apps/docs/docs/api/` is generated at build time from source — do not edit those files manually. They regenerate from `docusaurus-plugin-typedoc` entries in `apps/docs/docusaurus.config.ts`.

If you add a new package that should appear in the API reference, add a new `docusaurus-plugin-typedoc` entry in the config.

## Testing docs changes

```bash
turbo run dev --filter=docs    # preview at http://localhost:1337
turbo run build --filter=docs  # verify build succeeds (catches broken links)
```
