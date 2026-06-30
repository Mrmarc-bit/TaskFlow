# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Generate Prisma client
# Prisma v7: uses prisma.config.ts + adapter, no DATABASE_URL needed at generate time
RUN npx prisma generate --config prisma.config.ts || npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and prisma config
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client for production
RUN npx prisma generate --config prisma.config.ts || npx prisma generate

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

# Run migrations then start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
