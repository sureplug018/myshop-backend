# ==========================
# Stage 1: Build
# ==========================
FROM node:20-alpine AS builder

# Create user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only files needed for install
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# --- Pass DATABASE_URL as build argument ---
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# ==========================
# Stage 2: Production image
# ==========================
FROM node:20-alpine

WORKDIR /app

# Create user
RUN addgroup -S app && adduser -S app -G app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only production dependencies from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/views ./views

# Set ownership
RUN chown -R app:app /app
USER app

EXPOSE 3000
CMD ["pnpm", "start"]
# ==========================