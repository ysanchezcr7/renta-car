#!/bin/sh
set -e

# Migraciones (DATABASE_URL debe apuntar al host `postgres:5432` en Docker Compose)
if [ "${SKIP_PRISMA_MIGRATE:-0}" != "1" ]; then
  echo "[entrypoint] prisma migrate deploy..."
  npx prisma migrate deploy || echo "[entrypoint] migrate deploy omitido o con avisos; continúa el arranque."
fi

echo "[entrypoint] iniciando API..."
exec node dist/src/main.js
