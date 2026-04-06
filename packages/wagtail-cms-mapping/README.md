# @repo/wagtail-cms-mapping

Maps Wagtail CMS data to React components. Ships default block and page layout components using `@hseireland/hse-frontend-react`, with per-app override support via a factory function.

## Quick start

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
const { renderPage } = createCMSRenderer();
```

## Overriding components

```typescript
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import { MyQuote } from "./components/my-quote";
const { renderPage } = createCMSRenderer({
  blocks: { quote: MyQuote },
  pages: { "hsebase.ContentPage": MyContentPage },
});
```

## Usage in a catch-all route

```typescript
// app/[[...slug]]/page.tsx
import { createCMSRenderer } from "@repo/wagtail-cms-mapping";
import { CMSClient } from "@repo/wagtail-api-client";
const { renderPage } = createCMSRenderer();
const client = new CMSClient({ baseURL: "...", apiPath: "/api/cms/v2" });
export default async function Page({ params }) {
  const { slug } = await params;
  const path = slug ? `/${slug.join("/")}/` : "/";
  const page = await client.findPageByPath(path);
  if (!page || "message" in page) notFound();
  return renderPage(page);
}
```

## Available block components

| Block type(s) | Component | Design system |
|---|---|---|
| text, rich_text_block, richtext | BlockText | html-react-parser |
| image | BlockImage | Responsive picture |
| inset_text | BlockInsetText | InsetText |
| quote | BlockQuote | BlockQuote |
| top_tasks, top_task | BlockPromo | Promo |
| links_list_group_v2 | BlockLinksList | LinksList |
| action_link | BlockActionLink | ActionLink |
| expander, details | BlockDetails | Details |
| expander_group | BlockDetailsGroup | Details.ExpanderGroup |
| button_list | BlockButton | Button |
| content_block_chooser | BlockContentBlock | Recursive renderer |
| brightcove_video | BlockBrightcove | iframe embed |
| related_information | BlockRelatedInfo | Semantic HTML |
| teaser_links | BlockTeaserLinks | Promo |

## Available page layouts

| Page type | Layout |
|---|---|
| hsebase.ContentPage | Body (2/3) + optional SideNav (1/3) |
| hsebase.LandingPage | Top + Body + Bottom (full width) |
| hsebase.CuratedHubPage | Body + Bottom (2/3) |
| hsebase.OrganisationListingPage | Result count + Links |
| hsebase.OrganisationLandingPage | Body + Bottom (full width) |

## Custom block components

```typescript
import type { BlockComponentProps } from "@repo/wagtail-cms-mapping/types";
type MyValue = { title: string; body: string };
export function MyBlock({ value }: BlockComponentProps<MyValue>) {
  return <div><h2>{value.title}</h2><p>{value.body}</p></div>;
}
```

## Custom page layouts

```typescript
import type { PageLayoutProps } from "@repo/wagtail-cms-mapping/types";
export function MyPage({ page, renderBlocks }: PageLayoutProps) {
  return <main><h1>{page.title}</h1>{renderBlocks(page.body)}</main>;
}
```

## Sub-path exports

| Import | Contents |
|---|---|
| @repo/wagtail-cms-mapping | createCMSRenderer factory |
| @repo/wagtail-cms-mapping/blocks | Default block registry + all block components |
| @repo/wagtail-cms-mapping/pages | Default page registry + all page components |
| @repo/wagtail-cms-mapping/types | TypeScript types + type guards (no React dependency) |
