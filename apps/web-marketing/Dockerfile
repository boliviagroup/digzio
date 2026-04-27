# ── Single-stage production image using pre-built dist ────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install all deps (needed for express runtime)
RUN pnpm install --no-frozen-lockfile --prod

# Copy pre-built dist from host
COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
