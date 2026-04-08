# Header & Footer Implementation

CMS-driven header and footer for the multisite template app, using the HSE design system compound components and Wagtail custom API endpoints.

## Context

The template app currently renders page content with no persistent site chrome. The HSE design system provides `Header` and `Footer` compound components. Wagtail exposes header/footer configuration via custom endpoints (`/api/headers/`, `/api/footers/`) outside the standard `/api/v2/` path. Every site in the multisite setup will have these same endpoints.

## Scope

- Navigation links rendered in header and footer
- `next/link` used for internal links (client-side routing)
- Logo-only fallback header if CMS fetch fails
- No search, service name, translations menu, or locale-aware fetching (deferred)

## Data sources

### Header endpoint

`GET /api/headers/` returns an array. We use the first item.

```json
{
  "id": 1,
  "name": "Org Header",
  "service_name": "",
  "service_long_name": false,
  "transactional": false,
  "logo_aria": null,
  "show_search": false,
  "search_prompt_text": "Search",
  "navigation_text": "Information about the HSE as an organisation",
  "locale": 1,
  "logo_link": null,
  "navigation_links": [
    {
      "id": 35,
      "translation_key": "8fd86794-...",
      "sort_order": 0,
      "label": "Jobs",
      "link_url": "https://about.hse.ie/jobs",
      "locale": 1,
      "snippet": 1,
      "page": null
    }
  ],
  "navigation_secondary_links": [
    {
      "id": 1,
      "translation_key": "7cec1a14-...",
      "sort_order": 0,
      "label": "HSE.ie",
      "link_url": "https://www.hse.ie/",
      "locale": 1,
      "snippet": 1
    }
  ],
  "header_mobile_links": [
    {
      "id": 2,
      "translation_key": "799bc8cb-...",
      "sort_order": 0,
      "label": "Jobs",
      "link_url": "https://about.hse.ie/jobs/",
      "locale": 1,
      "snippet": 1
    }
  ]
}
```

### Footer endpoint

`GET /api/footers/` returns an array. We use the first item.

```json
{
  "id": 1,
  "name": "Org Footer",
  "locale": 1,
  "footer_links": [
    {
      "id": 1,
      "translation_key": "46f1b5bf-...",
      "sort_order": 0,
      "link_url": "https://www2.hse.ie/complaints-feedback/",
      "link_label": "Complaints and feedback",
      "locale": 1,
      "snippet": 1
    }
  ],
  "footer_secondary_links": [
    {
      "id": 1,
      "translation_key": "a25d3cce-...",
      "sort_order": 0,
      "link_url": "https://www2.hse.ie/privacy-statement/",
      "link_label": "Privacy statement",
      "locale": 1,
      "snippet": 1
    }
  ]
}
```

## Package changes

### 1. `@repo/wagtail-cms-types` — Replace settings schemas

Remove all existing schemas in `types/settings/index.ts` (they're from another project and don't match any real API).

New schemas matching the live API:

**Shared link schemas:**

- `CMSHeaderNavLinkSchema` — nav link with `label`, `link_url`, and optional `page` field (used in `navigation_links`)
- `CMSHeaderSecondaryNavLinkSchema` — nav link with `label` and `link_url`, no `page` field (used in `navigation_secondary_links` and `header_mobile_links`)
- `CMSFooterLinkSchema` — link with `link_label` and `link_url` (used in `footer_links` and `footer_secondary_links`)

**Response schemas:**

- `CMSHeaderResponseSchema` — full header response item with all fields
- `CMSFooterResponseSchema` — full footer response item with all fields
- `CMSHeaderAPIResponseSchema` — `z.array(CMSHeaderResponseSchema)` (raw API shape)
- `CMSFooterAPIResponseSchema` — `z.array(CMSFooterResponseSchema)` (raw API shape)

All schemas and inferred types get TSDoc comments.

### 2. `@repo/wagtail-api-client` — New CMSClient methods

**Private helper:**

```typescript
private async fetchBaseEndpoint<T>(path: string, init?: RequestInit): Promise<T | NotFoundContents>
```

Fetches from `${baseURL}/${path}` (no `apiPath` prefix). Used for endpoints outside the standard Wagtail API path.

**Public methods:**

```typescript
public async fetchHeader(init?: RequestInit): Promise<CMSHeaderResponse | NotFoundContents>
public async fetchFooter(init?: RequestInit): Promise<CMSFooterResponse | NotFoundContents>
```

Each method:
1. Calls `fetchBaseEndpoint` with the appropriate path (`api/headers/`, `api/footers/`)
2. Extracts `[0]` from the array response
3. Returns the typed object, or `NotFoundContents` if the fetch fails or array is empty

ISR revalidation is controlled by the caller via `init` (same pattern as existing methods).

### 3. App-level components

#### `apps/hse-multisite-template/src/components/site-header.tsx`

Server Component that maps `CMSHeaderResponse` to the design system `Header`:

- `Header.Logo` — always rendered, links to `logo_link` or `/`
- `Header.MainMenu` + `Header.MainMenu.Item` — maps `navigation_links`
- `Header.MobileMenu` + `Header.MobileMenu.Item` — maps `header_mobile_links`
- `Header.UtilityMenu` + `Header.UtilityMenu.Item` — maps `navigation_secondary_links`
- Uses `next/link` via the design system's element override prop (e.g., `asElement`) for internal links
- Props: `{ data: CMSHeaderResponse | null }` — renders logo-only fallback when `data` is null

#### `apps/hse-multisite-template/src/components/site-footer.tsx`

Server Component that maps `CMSFooterResponse` to the design system `Footer`:

- `Footer.Top` / `Footer.List` / `Footer.ListItem` — maps `footer_links`
- `Footer.Bottom` with secondary links — maps `footer_secondary_links`
- Uses `next/link` via the design system's element override prop for internal links
- Props: `{ data: CMSFooterResponse | null }` — renders copyright-only fallback when `data` is null

### 4. Layout integration

In `apps/hse-multisite-template/src/app/[lang]/layout.tsx`:

```
layout.tsx (Server Component)
├── fetch header + footer (parallel, ISR 1hr revalidation)
├── <SiteHeader data={header} />   ← logo-only fallback if fetch failed
├── {children}
└── <SiteFooter data={footer} />   ← copyright-only fallback if fetch failed
```

**Error handling:**
- Header fetch fails → log `warn`, render `SiteHeader` with `data={null}` (logo-only fallback)
- Footer fetch fails → log `warn`, render `SiteFooter` with `data={null}` (copyright-only fallback)
- Uses `@repo/logger` for structured logging

## Out of scope

- Search functionality (`show_search`, `search_prompt_text`)
- Service name / transactional header mode
- Translations menu / locale-aware fetching
- Image optimisation for header banner images
- `@repo/hse-custom-ui` package (deferred)
- Mega-menu / nested sub-navigation patterns

## Design system patterns (from Storybook)

**Header fallback** — "With Logo Only" story:
```tsx
<Header>
  <Header.Logo href="#" ariaLabel="H-S-E - homepage" />
</Header>
```

**Footer fallback** — "Copyright Only" story:
```tsx
<Footer>
  <Footer.Bottom>
    <Footer.Copyright />
  </Footer.Bottom>
</Footer>
```

**Component API notes:**
- All link items (`Header.MainMenu.Item`, `Header.UtilityMenu.Item`, `Header.MobileMenu.Item`, `Footer.ListItem`) accept `href` as a prop
- `Header.Logo` accepts `href` and `ariaLabel`
- `Footer.Copyright` renders `© Health Service Executive` by default (accepts children to override)
- `Footer.ListItem` is a `forwardRef` component

## Design system component investigation needed

The `next/link` passthrough mechanism on `Header.MainMenu.Item`, `Header.MobileMenu.Item`, `Header.UtilityMenu.Item`, and `Footer.ListItem` needs to be investigated during implementation. Storybook docs show only `href` string props — no `asElement` or `as` prop is documented. The actual component source in `node_modules` needs to be checked for polymorphic element support. If the design system doesn't support element override, we'll wrap items or use `next/link` with `passHref`. This is a known risk flagged by the user from prior experience.
