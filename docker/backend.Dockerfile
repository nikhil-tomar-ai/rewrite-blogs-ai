# ─── Stage 1: Build ───────────────────────────────────────────────────────────
# Use a glibc-based image for the build so that Rollup's native bindings
# (@rollup/rollup-linux-x64-gnu) resolve correctly during `vite build`.
FROM node:20-slim AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./

# Install ALL deps (including devDependencies like vite, esbuild, tsx)
# --include=optional ensures platform-specific optional packages are installed
RUN npm ci --include=optional

# Copy source
COPY . .

# Build frontend (vite) + backend bundle (esbuild)
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

# Copy manifests and install only production runtime deps
COPY package*.json ./
RUN npm ci --omit=dev --include=optional

# Copy the built output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV LLM_PROVIDER=ollama
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434

CMD ["node", "dist/server.mjs"]
