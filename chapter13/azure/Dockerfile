# アプリケーションをビルド
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
RUN npx mastra build

# Azure Container Appsで起動するイメージを作成
FROM node:22-slim AS runner
WORKDIR /app
COPY --from=builder /app/.mastra/output ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.mjs"]
