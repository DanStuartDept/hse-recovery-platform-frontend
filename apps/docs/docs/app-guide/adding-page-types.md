---
sidebar_position: 6
---

# Adding Page Types

Page types correspond to Wagtail page models. Each model has a unique type string (`app_label.ModelName`) that appears in `page.meta.type`. When `renderPage` receives a page, it looks up `meta.type` in the page registry and renders the matching layout component.

## Existing page types

| Wagtail type | Layout component | Key fields |
|---|---|---|
| `hsebase.ContentPage` | `ContentPage` | `body` (blocks), `side_nav` |
| `hsebase.LandingPage` | `LandingPage` | `lead_text`, `top_content`, `content`, `bottom_content` |
| `hsebase.CuratedHubPage` | `CuratedHubPage` | `lead_text`, `content`, `bottom_content` |
| `hsebase.OrganisationListingPage` | `OrganisationListingPage` | `lead_text`, `organisation_links`, `organisation_links_count` |
| `hsebase.OrganisationLandingPage` | `OrganisationLandingPage` | `lead_text`, `content`, `bottom_content` |

## Existing page layout pattern

Here is `ContentPage` as a representative example:

**Zod schema** — `packages/wagtail-cms-types/src/types/page-models/hsebase.ts`
```ts
export const CMSContentPagePropsSchema = CMSPageWithBlocksSchema.extend({
  lead_text: z.string().optional(),
  side_nav: z.array(NavItemSchema).optional(),
});
export type CMSContentPageProps = z.infer<typeof CMSContentPagePropsSchema>;
```

**Narrowing helper** — `packages/wagtail-cms-mapping/src/types/index.ts`
```ts
export function isContentPage(page: CMSPageProps): page is CMSContentPageProps {
  return page.meta.type === "hsebase.ContentPage";
}
```

**Layout component** — `packages/wagtail-cms-mapping/src/pages/content-page.tsx`
```tsx
export function ContentPage({ page, renderBlocks }: PageLayoutProps) {
  const cp = isContentPage(page) ? page : undefined;
  return (
    <Container>
      <Row>
        <Col width="two-thirds">
          <PageTitle title={page.title} />
          {cp?.body && renderBlocks(cp.body)}
        </Col>
        {cp?.side_nav && cp.side_nav.length > 0 && (
          <Col width="one-third">
            <aside>...</aside>
          </Col>
        )}
      </Row>
    </Container>
  );
}
```

**Registry entry** — `packages/wagtail-cms-mapping/src/pages/index.ts`
```ts
export const defaultPageRegistry: PageRegistry = {
  "hsebase.ContentPage": ContentPage,
  // ...
};
```

## Step-by-step guide

### 1. Add the page type to `CMSPageTypeSchema`

Open `packages/wagtail-cms-types/src/types/core/index.ts` and add the new type string:

```ts
export const CMSPageTypeSchema = z.enum([
  // ... existing types ...
  "hsebase.MyNewPage",
]);
```

The string must match the `app_label.ModelName` value Wagtail sends in `page.meta.type`.

### 2. Define the Zod schema

Add the schema to `packages/wagtail-cms-types/src/types/page-models/hsebase.ts`:

```ts
export const CMSMyNewPagePropsSchema = CMSPageContentSchema.extend({
  lead_text: z.string().optional(),
  featured_blocks: z.array(BaseCMSBlockTypeSchema).optional(),
  content: z.array(BaseCMSBlockTypeSchema).optional(),
});
export type CMSMyNewPageProps = z.infer<typeof CMSMyNewPagePropsSchema>;
```

Use `CMSPageContentSchema` as the base for pages without a body/header block array, or `CMSPageWithBlocksSchema` for pages that include the standard `header` and `body` fields.

Then export the type from `packages/wagtail-cms-types/src/types/page-models/index.ts` and add it to the `CMSPageProps` union:

```ts
export type CMSPageProps =
  | CMSContentPageProps
  | CMSLandingPageProps
  // ... existing types ...
  | CMSMyNewPageProps;
```

### 3. Add a narrowing type guard

Add an `isMyNewPage` helper in `packages/wagtail-cms-mapping/src/types/index.ts`:

```ts
export function isMyNewPage(page: CMSPageProps): page is CMSMyNewPageProps {
  return page.meta.type === "hsebase.MyNewPage";
}
```

### 4. Create the layout component

Create `packages/wagtail-cms-mapping/src/pages/my-new-page.tsx`:

```tsx
import { Container } from "@hseireland/hse-frontend-react";
import { PageTitle } from "../components/page-title";
import type { PageLayoutProps } from "../types/index";
import { isMyNewPage } from "../types/index";

export function MyNewPage({ page, renderBlocks }: PageLayoutProps) {
  const p = isMyNewPage(page) ? page : undefined;
  return (
    <Container>
      <PageTitle title={page.title} richLead={p?.lead_text} />
      {p?.featured_blocks && renderBlocks(p.featured_blocks)}
      {p?.content && renderBlocks(p.content)}
    </Container>
  );
}
```

Key points:
- `PageLayoutProps` provides `page` (the full `CMSPageProps` union), `context` (page + apiClient, no position), and `renderBlocks`.
- Always narrow `page` with your type guard before accessing page-specific fields — `page` is typed as the full union.
- `renderBlocks` handles block registry lookup and position metadata automatically.
- Use `PageTitle` from `../components/page-title` for consistent title + lead text rendering.

### 5. Register the layout

Open `packages/wagtail-cms-mapping/src/pages/index.ts`:

```ts
import { MyNewPage } from "./my-new-page";

export const defaultPageRegistry: PageRegistry = {
  // ... existing entries ...
  "hsebase.MyNewPage": MyNewPage,
};

export {
  // ... existing exports ...
  MyNewPage,
};
```

### 6. Write tests

Add tests in `packages/wagtail-cms-mapping/src/pages/pages.test.tsx` or a dedicated file:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyNewPage } from "./my-new-page";
import { mockPageContext } from "../vitest.setup";

describe("MyNewPage", () => {
  it("renders the page title", () => {
    render(
      <MyNewPage
        page={{ ...mockPageContext.page, title: "My New Page", meta: { ...mockPageContext.page.meta, type: "hsebase.MyNewPage" } }}
        context={mockPageContext}
        renderBlocks={() => []}
      />,
    );
    expect(screen.getByRole("heading", { name: "My New Page" })).toBeInTheDocument();
  });
});
```

Run the tests:

```bash
cd packages/wagtail-cms-mapping && pnpm vitest run
```

## Fallback behaviour

If a page type arrives from the CMS that has no registered layout, `createCMSRenderer` renders `DefaultFallbackPage`, which shows the page title and a message indicating no layout is registered. This is intentional — it allows the app to handle unknown page types gracefully without crashing.
