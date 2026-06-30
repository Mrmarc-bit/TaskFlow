# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json ./

# Install all deps (needed for build + prisma generate)
RUN npm ci

# Generate Prisma client (Prisma v7 adapter style)
RUN npx prisma generate --config prisma.config.ts || npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json ./

# Install all deps (ts-node needed for seed on first run)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --config prisma.config.ts || npx prisma generate

# Copy compiled app
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

# Migrate → Seed (idempotent, safe to run every deploy) → Start
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/src/main"]
