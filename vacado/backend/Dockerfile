# ─── Build ──────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Runtime ────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# ffmpeg is required by videoService for composition.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg openssl \
    fonts-noto-core fonts-noto-cjk fonts-noto-color-emoji \
    fontconfig \
  && fc-cache -fv \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
