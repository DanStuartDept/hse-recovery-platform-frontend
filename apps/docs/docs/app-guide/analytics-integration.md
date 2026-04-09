---
sidebar_position: 7
---

# Analytics Integration

The app integrates three third-party analytics and consent tools: Google Tag Manager, OneTrust cookie consent, and Piwik Pro. All three are loaded conditionally — they only appear when the corresponding env vars are configured, and none of them load on localhost.

## How conditional loading works

Each script component reads from `config` (from `@repo/app-config`) at render time:

```ts
if (config.isLocalhost || !config.gtmId) {
  return null;
}
```

`config.isLocalhost` is `true` when `NEXT_PUBLIC_ENVIRONMENT_NAME` equals `"local"`. This single flag suppresses all analytics on local development environments regardless of whether other env vars are set.

All three components follow the same guard pattern:

| Component | Config property | Env var |
|---|---|---|
| `GtmScripts` | `config.gtmId` | `NEXT_PUBLIC_GTM_ID` |
| `OneTrustScripts` | `config.oneTrustDomainId` | `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` |
| `PiwikProScripts` | `config.piwik` | `NEXT_PUBLIC_PIWIK_CONTAINER_ID` + `NEXT_PUBLIC_PIWIK_CONTAINER_URL` |

## Google Tag Manager (`GtmScripts`)

Source: `src/components/scripts/GtmScripts.tsx`

```tsx
import { GoogleTagManager } from "@next/third-parties/google";
import { config } from "@repo/app-config";

export function GtmScripts() {
  if (config.isLocalhost || !config.gtmId) {
    return null;
  }
  return <GoogleTagManager gtmId={config.gtmId} />;
}
```

Uses `@next/third-parties/google` which handles both the inline `<script>` tag (for the data layer push) and the `<noscript>` `<iframe>` fallback automatically. The component is rendered inside `<html>` before `<body>` in the root layout — `@next/third-parties` places the output in the correct position in the document.

Rendering location in layout:
```tsx
<html lang={lang}>
  <GtmScripts />
  <body>...</body>
</html>
```

## OneTrust cookie consent (`OneTrustScripts`)

Source: `src/components/scripts/OneTrustScripts.tsx`

```tsx
export function OneTrustScripts() {
  if (config.isLocalhost || !config.oneTrustDomainId) {
    return null;
  }
  return (
    <>
      <Script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        strategy="beforeInteractive"
        data-domain-script={config.oneTrustDomainId}
        data-document-language="true"
      />
      <Script id="onetrust-optanon" strategy="beforeInteractive">
        {"function OptanonWrapper() {}"}
      </Script>
    </>
  );
}
```

`strategy="beforeInteractive"` ensures the OneTrust SDK and its `OptanonWrapper` callback are loaded before any interactive content. The `OptanonWrapper` function is required by the OneTrust SDK — it fires after the consent banner initialises and whenever the user updates their preferences.

`data-document-language="true"` tells OneTrust to use the page's `<html lang>` attribute to select the correct banner language.

The component is rendered at the top of `<body>` in the root layout, before other providers.

## Piwik Pro analytics (`PiwikProScripts`)

Source: `src/components/scripts/PiwikProScripts.tsx`

```tsx
import PiwikProProvider from "@piwikpro/next-piwik-pro";

export function PiwikProScripts({ children }: { children: React.ReactNode }) {
  if (config.isLocalhost || !config.piwik) {
    return <>{children}</>;
  }
  return (
    <PiwikProProvider
      containerId={config.piwik.containerId}
      containerUrl={config.piwik.containerUrl}
    >
      {children}
    </PiwikProProvider>
  );
}
```

Unlike GTM and OneTrust, Piwik Pro is a React context provider rather than a script tag. When not configured or on localhost, children are rendered without a provider wrapper — no overhead, no tracking. When configured, `PiwikProProvider` injects the tracking script and makes analytics methods available to child components via React context.

`@piwikpro/next-piwik-pro` is listed in `transpilePackages` in `next.config.ts` because it ships ESM-only code that Next.js needs to transpile.

Rendering location in layout — wraps the `DictionaryProvider`, `SiteHeader`, page content, and `SiteFooter`:
```tsx
<PiwikProScripts>
  <DictionaryProvider flat={flat} locale={lang}>
    <SiteHeader data={headerData} />
    {props.children}
    <SiteFooter data={footerData} />
  </DictionaryProvider>
</PiwikProScripts>
```

## CSP and analytics domains

When an analytics integration is configured, its domains are automatically added to the Content Security Policy. If `NEXT_PUBLIC_GTM_ID` is not set, GTM domains do not appear in the CSP. See [Security Headers](./security-headers.md) for how this works.

## Adding a new analytics integration

1. Add the required env vars to `@repo/app-config` with Zod validation.
2. Create a script component in `src/components/scripts/` following the same guard pattern.
3. Render the component in `src/app/[lang]/layout.tsx` at the appropriate position.
4. Add the integration's domains to `security-headers.ts` (conditionally, gated on the same env var check).
