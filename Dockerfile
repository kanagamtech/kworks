# Stage 1: Build Expo Web App
FROM node:20-alpine AS builder

WORKDIR /app

# Install app dependencies
COPY app/package*.json ./app/
RUN cd app && npm install

# Build Expo Web App bundle
COPY app/ ./app/
RUN cd app && npx expo export --platform web

# Stage 2: Production Server
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./
COPY site/ ./site/
COPY --from=builder /app/app/dist ./app_dist

EXPOSE 10000 5000

ENV PORT=10000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:10000/api/health || exit 1

CMD ["node", "server.js"]
