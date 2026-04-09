# =============================================================================
# Multi-stage Docker build for hse-multisite-template (pnpm + Turborepo monorepo)
# Based on: https://github.com/vercel/next.js/blob/canary/examples/with-docker
#
# Build (from repo root):
#   docker build \
#     -f apps/hse-multisite-template/Dockerfile \
#     --secret id=NPM_TOKEN \
#     --build-arg NEXT_PUBLIC_CMS_API_ENDPOINT=https://cms.example.com \
#     --build-arg NEXT_PUBLIC_API_PATH=/api/v2 \
#     --build-arg NEXT_PUBLIC_ENVIRONMENT_NAME=prod \
#     --build-arg NEXT_PUBLIC_SITEURL=https://www.example.com \
#     -t hse-multisite-template .
#
# Run:
#   docker run -p 3000:3000 hse-multisite-template
# =============================================================================

ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS base
RUN corepack enable pnpm

# =============================================================================
# Stage 1: Prune monorepo to only what the target app needs
# =============================================================================
FROM base AS pruner
RUN npm install -g turbo@^2
WORKDIR /app
COPY . .
RUN turbo prune hse-multisite-template --docker

# =============================================================================
# Stage 2: Install dependencies from pruned lockfile
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copy pruned workspace structure (package.json files + lockfile + pnpm-workspace.yaml)
COPY --from=pruner /app/out/json/ .

# Copy .npmrc and inject GitHub Packages auth token via build secret.
# The secret is only available during this RUN instruction — never stored in any layer.
COPY .npmrc .
RUN --mount=type=secret,id=NPM_TOKEN \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" >> .npmrc \
    && pnpm install --frozen-lockfile \
    && rm -f .npmrc

# =============================================================================
# Stage 3: Build the Next.js application
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/ .

# Copy full source code from pruned output
COPY --from=pruner /app/out/full/ .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are inlined by Next.js at build time — pass as build args.
# Required:
ARG NEXT_PUBLIC_CMS_API_ENDPOINT
ARG NEXT_PUBLIC_API_PATH
ARG NEXT_PUBLIC_ENVIRONMENT_NAME
ARG NEXT_PUBLIC_SITEURL
# Optional:
ARG NEXT_PUBLIC_REMOTE_IMAGE_DOMAINS
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_ONETRUST_DOMAIN_ID
ARG NEXT_PUBLIC_PIWIK_CONTAINER_ID
ARG NEXT_PUBLIC_PIWIK_CONTAINER_URL

# Turbo builds internal packages (bunchee) then the Next.js app in dependency order
RUN pnpm turbo run build --filter=hse-multisite-template

# =============================================================================
# Stage 4: Production runner (standalone output)
# =============================================================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder --chown=node:node /app/apps/hse-multisite-template/public ./apps/hse-multisite-template/public

# Create .next directory with correct permissions for prerender cache
RUN mkdir -p apps/hse-multisite-template/.next && chown node:node apps/hse-multisite-template/.next

# Standalone output includes server.js + pruned node_modules mirroring the monorepo layout
COPY --from=builder --chown=node:node /app/apps/hse-multisite-template/.next/standalone ./

# Static assets are not included in standalone output — copy them separately
COPY --from=builder --chown=node:node /app/apps/hse-multisite-template/.next/static ./apps/hse-multisite-template/.next/static

USER node
EXPOSE 3000

CMD ["node", "apps/hse-multisite-template/server.js"]
