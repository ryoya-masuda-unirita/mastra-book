FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV AWS_REGION=ap-northeast-1
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
RUN useradd -m bedrock_agentcore
USER bedrock_agentcore
EXPOSE 8080
CMD ["node", "dist/agent.js"]