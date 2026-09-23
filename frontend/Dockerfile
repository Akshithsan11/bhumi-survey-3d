FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY vite.config.ts tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage with serve
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Install serve for static hosting
RUN npm install -g serve

# Start the app
CMD ["serve", "-s", "/app/dist", "-l", "http://0.0.0.0:5173"]