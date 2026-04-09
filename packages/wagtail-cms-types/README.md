# @repo/wagtail-cms-types

Zod-based TypeScript types for Wagtail CMS integration. Covers all CMS content structures: blocks, page models, fields, settings, and snippets.

## Usage

Add the package as a dev dependency in a workspace package:

```
"@repo/wagtail-cms-types": "workspace:*"
```

Import from sub-path exports:

```typescript
import { CMSBlockType } from "@repo/wagtail-cms-types/blocks";
import { CMSQueries, CMSPageContent, ClientOptions } from "@repo/wagtail-cms-types/core";
import { CMSPageProps, CMSPageType } from "@repo/wagtail-cms-types/page-models";
import { FieldTypeImage, FieldTypeCta } from "@repo/wagtail-cms-types/fields";
```

## Sub-path exports

| Import | Contents |
|---|---|
| `@repo/wagtail-cms-types/blocks` | Block type enums, component prop interfaces, value types |
| `@repo/wagtail-cms-types/core` | Client options, API queries, page content, paginated responses, page metadata |
| `@repo/wagtail-cms-types/page-models` | Page type definitions (HomePage, LandingPage, ContentPage, etc.) |
| `@repo/wagtail-cms-types/fields` | Common field types (images, CTAs, video, heading levels) |
| `@repo/wagtail-cms-types/settings` | Site settings types |
| `@repo/wagtail-cms-types/snippets` | Reusable content snippet types |

## Documentation

Generate API docs with TypeDoc:

```sh
pnpm docs              # one-off build to public/
pnpm dev:docs          # watch + live-server on port 3002
```

## Architecture

Source-only package — no build step. The `exports` map points directly at `.ts` files. All types are Zod schemas with inferred TypeScript types.

## Related packages

- `@repo/wagtail-api-client` — API client that consumes these types
- `@repo/wagtail-cms-mapping` — component mapping that renders CMS data typed by this package
