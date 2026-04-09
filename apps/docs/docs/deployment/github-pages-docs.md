---
sidebar_position: 4
---

# GitHub Pages — Docs Site

This documentation site (the one you are reading) is a [Docusaurus](https://docusaurus.io/) app located at `apps/docs/`. It is deployed to GitHub Pages automatically when changes to the docs are merged to `main`.

## Workflow

The deployment is defined in `.github/workflows/docs.yml`. It uses the official GitHub Pages deployment actions:

- `actions/configure-pages` — configures the Pages environment and returns the expected base URL
- `actions/upload-pages-artifact` — packages the static build output
- `actions/deploy-pages` — pushes the artefact to the `gh-pages` environment

## Triggers

The workflow runs on two events:

1. **Push to `main`** — filtered to paths that affect the docs site:
   ```yaml
   on:
     push:
       branches: [main]
       paths:
         - "apps/docs/**"
         - ".github/workflows/docs.yml"
   ```
   This means unrelated changes (application code, package updates) do not trigger a docs redeploy.

2. **Manual dispatch** — `workflow_dispatch` allows the workflow to be triggered by hand from the **Actions** tab in the GitHub repository. This is useful for force-redeploying after a configuration change (e.g., updating `docusaurus.config.ts`) without touching any docs content.

## Build

The workflow installs dependencies using the same setup action as the PR pipeline (`.github/actions/setup`), then runs:

```bash
pnpm turbo run build --filter=docs
```

Turborepo builds only the docs app and its workspace dependencies. The static output is written to `apps/docs/build/`.

## Required permissions

The workflow job needs explicit permissions to write to GitHub Pages:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

The `id-token: write` permission is required by `actions/deploy-pages` for OIDC-based authentication with the Pages service.

## Updating `url` and `baseUrl`

If the repository is renamed or transferred to a different GitHub organisation, two values in `apps/docs/docusaurus.config.ts` must be updated:

```ts
const config: Config = {
  url: "https://<org>.github.io",   // GitHub Pages domain for the org/user
  baseUrl: "/<repo-name>/",          // repository name as the URL prefix
  ...
};
```

GitHub Pages for an organisation repository is served at `https://<org>.github.io/<repo>/`. If the repo is ever configured as a custom domain (e.g., `docs.hse.ie`), set `url` to the custom domain and `baseUrl` to `"/"`.

## Enabling GitHub Pages

GitHub Pages must be enabled in the repository settings before the first deployment:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Save

After the first successful workflow run, the site will be available at the URL shown in the Pages settings.
