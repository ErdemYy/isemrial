# =======================================================
# İşEmriAl — NestJS Backend API Production Dockerfile
# Multi-stage, Prisma client generated, non-root user
# =======================================================

# Stage 1: Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl wget
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN pnpm run prisma:generate

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY . .
ENV NODE_ENV=production
RUN pnpm run build

# Stage 4: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy dependencies, built artifacts, prisma schema & migrations, and scripts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY package.json ./

# Security: Ensure non-root node user owns application files
RUN chown -R node:node /app

USER node

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "dist/src/main.js"]
