# Multi-stage production build Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build SvelteKit production bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/build ./build
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db

EXPOSE 5173

CMD ["node", "build"]
