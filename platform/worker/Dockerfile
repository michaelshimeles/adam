# Build-worker image: long-running Node process that claims deploy jobs from
# the builder control plane and runs the full materialize → eve build →
# convex provision → upload pipeline.
#
# Build context must be the monorepo root (see railway.toml).
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends rsync git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY platform ./platform

# DevDependencies are required: vite, eve, convex CLI, static-hosting, etc.
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
WORKDIR /app

# Scratch workspaces for per-job materialize (ephemeral disk is fine).
RUN mkdir -p /app/platform/worker/workspaces

CMD ["node", "platform/worker/src/index.mjs"]
