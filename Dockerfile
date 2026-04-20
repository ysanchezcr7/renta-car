# Renta Car API — NestJS + Prisma (PostgreSQL)
# Incluye devDependencies en la imagen final para poder ejecutar `prisma migrate deploy` al arranque.
# Para reducir tamaño en producción: multi-stage con `npm prune` y copiar solo @prisma/client generado.

FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# prisma.config.ts exige DATABASE_URL al cargar (no hace falta que la DB exista para `generate`)
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/prisma_build_dummy?schema=public"
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3001

COPY docker/entrypoint.sh /entrypoint.sh
# Windows suele guardar CRLF; el kernel Linux no encuentra /bin/sh\r
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
