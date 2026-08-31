# Stage 1: Build Expo Web App & Site Portal
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build Expo Web App
COPY app/package*.json ./app/
RUN cd app && npm install
COPY app/ ./app/
RUN cd app && npx expo export --platform web

# 2. Build Site Management Portal
COPY site/package*.json ./site/
RUN cd site && npm install
COPY site/ ./site/
RUN cd site && npm run build

# Stage 2: Production Server
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./
COPY site/ ./site/
COPY --from=builder /app/site/dist ./site/dist
COPY --from=builder /app/app/dist ./app_dist

EXPOSE 10000 5000

ENV PORT=10000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:10000/api/health || exit 1

CMD ["node", "server.js"]
