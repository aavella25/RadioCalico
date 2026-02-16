# Multi-stage Dockerfile for Radio Calico
# Supports both development and production builds

# Base stage - shared dependencies
FROM node:25-alpine AS base

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run in development mode with nodemon
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS production-deps

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run in production mode
CMD ["node", "server.js"]
