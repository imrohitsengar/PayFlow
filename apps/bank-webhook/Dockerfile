# ── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY turbo.json ./

COPY apps/bank-webhook/package.json ./apps/bank-webhook/
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN npm ci --workspace=apps/bank-webhook --include-workspace-root

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bank-webhook/node_modules ./apps/bank-webhook/node_modules
COPY apps/bank-webhook ./apps/bank-webhook
COPY packages/db ./packages/db

# Generate Prisma client then esbuild the webhook into a single file
RUN cd packages/db && npx prisma generate
RUN cd apps/bank-webhook && npx esbuild ./src/index.ts \
    --bundle \
    --platform=node \
    --external:@prisma/client \
    --outfile=dist/index.js

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/bank-webhook/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3003

CMD ["node", "dist/index.js"]
