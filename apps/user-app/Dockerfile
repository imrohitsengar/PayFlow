# ── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy package manifests for all apps and packages
COPY apps/user-app/package.json ./apps/user-app/
COPY apps/bank-webhook/package.json ./apps/bank-webhook/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY packages/store/package.json ./packages/store/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN npm ci --workspace=apps/user-app --include-workspace-root

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/user-app/node_modules ./apps/user-app/node_modules
COPY . .

# Generate Prisma client
RUN cd packages/db && npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=user-app

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Only copy what Next.js needs at runtime (standalone output)
COPY --from=builder /app/apps/user-app/.next/standalone ./
COPY --from=builder /app/apps/user-app/.next/static ./apps/user-app/.next/static
COPY --from=builder /app/apps/user-app/public ./apps/user-app/public

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/user-app/server.js"]
