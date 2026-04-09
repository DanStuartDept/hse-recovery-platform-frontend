---
sidebar_position: 8
---

# SEO and Metadata

The app uses a two-layer metadata strategy: the root layout sets app-level defaults and the catch-all page route provides per-page overrides from the CMS.

## Layer 1: Layout defaults

`src/app/[lang]/layout.tsx` exports a static `metadata` object:

```ts
const SITE_NAME = "HSE.ie";
const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const metadata: Metadata = {
  title: {
    template: TITLE_TEMPLATE,   // "About | HSE.ie"
    default: SITE_NAME,         // "HSE.ie" (when no page title is set)
  },
  metadataBase: new URL(config.siteUrl),
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/assets/images/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/images/favicons/favicon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/assets/images/favicons/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/assets/images/favicons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};
```

`metadataBase` is set from `config.siteUrl` so that relative URLs in metadata (canonical links, OG images) are resolved against the correct origin.

## Layer 2: Per-page metadata (`generateMetadata`)

The catch-all route exports `generateMetadata`, which fetches the CMS page and returns a `Metadata` object that Next.js merges with the layout defaults:

```ts
export async function generateMetadata(
  props: PageProps<"/[lang]/[[...slug]]">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const path = slugToPath(slug);
  const response = await cmsClient.findPageByPath(path, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (isNotFound(response)) {
    logCmsError(path, response);
    return {};
  }

  let defaultDescription: string | undefined;
  try {
    const flat = await loadDictionary(lang, dictionaryLoaders, i18nConfig.defaultLocale);
    defaultDescription = flat["meta.defaultDescription"];
  } catch (err) {
    warn("[i18n] Dictionary loading failed in generateMetadata for locale:", lang, err);
  }

  return generatePageMetadata(response as CMSPageProps, {
    siteUrl: config.siteUrl,
    path,
    defaultDescription,
  });
}
```

If the page is not found, `generateMetadata` returns an empty object — the layout defaults apply. If dictionary loading fails, `defaultDescription` is undefined and the CMS `search_description` is used without a fallback.

## `generatePageMetadata` (wagtail-cms-mapping)

`generatePageMetadata` (from `packages/wagtail-cms-mapping/src/utils/generate-page-metadata.ts`) maps CMS fields to the Next.js `Metadata` shape:

```ts
export function generatePageMetadata(
  page: CMSPageProps,
  options: PageMetadataOptions,
): Metadata {
  const { siteUrl, path, defaultDescription } = options;
  const description = page.meta.search_description || defaultDescription;

  return {
    title: page.meta.seo_title || page.title,
    ...(description && { description }),
    alternates: {
      canonical: `${siteUrl}${path}`,
    },
  };
}
```

### CMS field mapping

| CMS field | Next.js `Metadata` property | Fallback |
|---|---|---|
| `page.meta.seo_title` | `title` | `page.title` |
| `page.meta.search_description` | `description` | `flat["meta.defaultDescription"]` from the locale dictionary |
| `page.meta.html_url` (via `path`) | `alternates.canonical` | — |

The title is passed as a string, not an object — Next.js applies the layout's `title.template` automatically, producing `"About | HSE.ie"` from a title of `"About"`.

## `robots.ts`

Source: `src/app/robots.ts`

Generates `robots.txt` via the Next.js Metadata Route API:

```ts
export const revalidate = 86400; // Revalidate daily

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
```

All user agents are allowed to crawl all paths. The sitemap URL is constructed from `config.siteUrl`. The file revalidates once per day — `robots.txt` is unlikely to change frequently.

## `sitemap.ts`

Source: `src/app/sitemap.ts`

Generates `sitemap.xml` dynamically from the Wagtail pages API:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 3600;
```

`force-dynamic` ensures the sitemap is always generated server-side (not statically cached at build time). It revalidates every hour.

The sitemap:
1. Iterates over all configured locales
2. Paginates through `cmsClient.fetchPages` in batches of 20
3. Extracts the path from each page's `html_url`
4. Constructs the full URL: default locale pages get no prefix (`/about/`), non-default locales get a locale prefix (`/ga/faoi/`)
5. Uses `page.meta.last_published_at` as the `lastModified` value

If the CMS fetch fails, the error is logged and the sitemap returns whatever pages were collected before the failure (partial results rather than an error response).
