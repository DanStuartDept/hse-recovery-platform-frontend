---
sidebar_position: 2
---

# Docker Build

The `hse-multisite-template` app ships with a multi-stage Dockerfile optimised for monorepo builds. The image uses `next output: "standalone"` to produce a minimal self-contained runner that does not need the full `node_modules` tree at runtime.

## Important: build from the repo root

Docker builds **must be run from the monorepo root**, not from inside the app directory. The build context needs access to all workspace packages. Use `-f` to point at the app's Dockerfile:

```bash
docker build \
  -f apps/hse-multisite-template/Dockerfile \
  --secret id=NPM_TOKEN \
  --build-arg NEXT_PUBLIC_CMS_API_ENDPOINT=https://cms.hse.ie \
  --build-arg NEXT_PUBLIC_API_PATH=/api/v2 \
  --build-arg NEXT_PUBLIC_ENVIRONMENT_NAME=prod \
  --build-arg NEXT_PUBLIC_SITEURL=https://www.hse.ie \
  -t hse-multisite-template \
  .
```

The trailing `.` is the build context — the entire repo root. Omitting it or running from inside the app directory will fail.

## The NPM_TOKEN secret

The `@hseireland` design system packages are hosted on GitHub Packages and require authentication to install. The token is passed as a [Docker BuildKit secret](https://docs.docker.com/build/building/secrets/) — it is mounted only during the `RUN` instruction that calls `pnpm install` and is never written into any image layer.

```bash
--secret id=NPM_TOKEN
```

By default, Docker reads the secret value from the environment variable with the same name. Set it before running the build:

```bash
export NPM_TOKEN=ghp_your_token_here
docker build --secret id=NPM_TOKEN ...
```

Alternatively, point at a file:

```bash
--secret id=NPM_TOKEN,src=/path/to/token.txt
```

BuildKit must be enabled (it is the default for Docker >= 23.0). If you see an error about `--secret`, ensure `DOCKER_BUILDKIT=1` is set.

## Build stages

### Stage 1 — pruner

```dockerfile
FROM base AS pruner
RUN npm install -g turbo@^2
WORKDIR /app
COPY . .
RUN turbo prune hse-multisite-template --docker
```

`turbo prune` analyses the monorepo dependency graph and produces a minimal subset in `/app/out/`:

- `/app/out/json/` — all `package.json` files and the lockfile, with only the packages needed by `hse-multisite-template`
- `/app/out/full/` — the full source code of those packages

This ensures that subsequent stages do not copy gigabytes of irrelevant workspace packages, and that the lockfile hash only changes when the target app's actual dependencies change.

### Stage 2 — deps

```dockerfile
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY .npmrc .
RUN --mount=type=secret,id=NPM_TOKEN \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" >> .npmrc \
    && pnpm install --frozen-lockfile \
    && rm -f .npmrc
```

Key points:

- Only the pruned `package.json` files and lockfile are copied, not the source. This means the layer cache survives source-only changes.
- The GitHub Packages auth token is appended to `.npmrc` from the BuildKit secret, used for the install, then the `.npmrc` is deleted. The token never appears in any layer.
- The pnpm store is mounted as a cache volume so repeated builds do not re-download packages.
- `--frozen-lockfile` ensures the installed versions exactly match what is committed.

### Stage 3 — builder

```dockerfile
FROM base AS builder
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_CMS_API_ENDPOINT
ARG NEXT_PUBLIC_API_PATH
ARG NEXT_PUBLIC_ENVIRONMENT_NAME
ARG NEXT_PUBLIC_SITEURL
# ... optional args ...
RUN pnpm turbo run build --filter=hse-multisite-template
```

The `NEXT_PUBLIC_*` variables are declared as `ARG`s so they are available to Next.js during compilation. Next.js **inlines** these values into the JavaScript bundle at build time — this is why they must be passed as `--build-arg` rather than runtime `-e` flags.

`pnpm turbo run build --filter=hse-multisite-template` builds internal packages (via bunchee) in dependency order before compiling the Next.js app.

### Stage 4 — runner

```dockerfile
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/apps/hse-multisite-template/.next/standalone ./
COPY --from=builder /app/apps/hse-multisite-template/.next/static ./apps/hse-multisite-template/.next/static
COPY --from=builder /app/apps/hse-multisite-template/public ./apps/hse-multisite-template/public
USER node
EXPOSE 3000
CMD ["node", "apps/hse-multisite-template/server.js"]
```

The runner stage starts from a fresh base image with no build tools. It copies only:

- The standalone output from `next build` (includes a minimal `node_modules` subset mirroring the monorepo layout)
- The `.next/static/` directory (client-side assets not bundled into standalone)
- The `public/` directory (static files served directly)

The result is a much smaller image than copying the full `node_modules`. Server-only secrets (`PREVIEW_TOKEN`, `REVALIDATE_TOKEN`) are not baked in — pass them at runtime:

```bash
docker run \
  -p 3000:3000 \
  -e PREVIEW_TOKEN=your-secret \
  -e REVALIDATE_TOKEN=your-secret \
  hse-multisite-template
```

## Optional build args

Pass these as additional `--build-arg` flags to enable the corresponding features:

```bash
--build-arg NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS=assets.hse.ie,cdn.example.com
--build-arg NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
--build-arg NEXT_PUBLIC_ONETRUST_DOMAIN_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
--build-arg NEXT_PUBLIC_PIWIK_CONTAINER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
--build-arg NEXT_PUBLIC_PIWIK_CONTAINER_URL=https://yourorg.piwik.pro
```

See [Environment Variables](./environment-variables.md) for a full description of each variable.
