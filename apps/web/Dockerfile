# Multi-stage production Dockerfile for Next.js App
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY libs/networking ./libs/networking
COPY apps/web ./apps/web
RUN npm ci
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/libs/networking ./libs/networking
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
