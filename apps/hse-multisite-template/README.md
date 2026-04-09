# hse-multisite-template

Next.js 16 application template for the HSE Multisite Frontend. Uses the [HSE Ireland design system](https://github.com/HSEIreland) and fetches content via the Wagtail API client.

## Development

From the monorepo root:

```sh
turbo run dev --filter=hse-multisite-template
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```sh
turbo run build --filter=hse-multisite-template
```

## Docker

> **Important:** The Docker build must be run from the **monorepo root**, not from this directory. The build context needs access to all workspace packages so that `turbo prune` can resolve internal dependencies.

The Dockerfile uses a multi-stage build:

1. **Pruner** — `turbo prune --docker` extracts only the packages this app needs
2. **Dependencies** — installs from the pruned lockfile (private `@hseireland` packages require an `NPM_TOKEN`)
3. **Builder** — builds internal packages then the Next.js app in dependency order
4. **Runner** — minimal image with standalone output (~node + server.js)

### Build

```sh
NPM_TOKEN="$(grep '//npm.pkg.github.com/:_authToken=' ~/.npmrc | cut -d= -f2)" \
docker build \
  -f apps/hse-multisite-template/Dockerfile \
  --secret id=NPM_TOKEN \
  --build-arg NEXT_PUBLIC_CMS_API_ENDPOINT=https://dev.cms.hse.ie \
  --build-arg NEXT_PUBLIC_API_PATH=/api/v2 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT_NAME=dev \
  --build-arg NEXT_PUBLIC_SITEURL=https://dev.hse.ie \
  --build-arg NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS=assets.hse.ie \
  -t hse-multisite-template .
```

### Run

```sh
docker run -p 3000:3000 hse-multisite-template
```

### Build args

`NEXT_PUBLIC_*` vars are inlined by Next.js at build time — you must rebuild the image when they change.

| Arg | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CMS_API_ENDPOINT` | Yes | Wagtail CMS base URL |
| `NEXT_PUBLIC_API_PATH` | Yes | API path (e.g. `/api/v2`) |
| `NEXT_PUBLIC_ENVIRONMENT_NAME` | Yes | `dev`, `pre-prod`, or `prod` |
| `NEXT_PUBLIC_SITEURL` | Yes | Public site URL |
| `NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS` | No | Comma-separated image hostnames |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager ID |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_ID` | No | OneTrust cookie consent domain ID |
| `NEXT_PUBLIC_PIWIK_CONTAINER_ID` | No | Piwik container ID |
| `NEXT_PUBLIC_PIWIK_CONTAINER_URL` | No | Piwik instance URL |

### Runtime env vars

These can be passed at `docker run` time (not baked into the image):

| Var | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Server port |
| `HOSTNAME` | `0.0.0.0` | Server bind address |
| `PREVIEW_TOKEN` | — | CMS preview mode secret |
| `REVALIDATE_TOKEN` | — | On-demand ISR revalidation secret |
