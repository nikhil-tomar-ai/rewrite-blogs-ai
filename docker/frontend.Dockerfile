# ─── Stage 1: Build ───────────────────────────────────────────────────────────
# Use glibc-based slim instead of alpine to avoid musl/rollup optional package issues
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

# Install all deps including optional (needed for @rollup/rollup-linux-x64-gnu)
RUN npm ci --include=optional

COPY . .
RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
