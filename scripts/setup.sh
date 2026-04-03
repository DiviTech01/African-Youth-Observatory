#!/bin/bash
set -e

echo "======================================="
echo " African Youth Database — Full Setup"
echo "======================================="
echo ""

# 1. Install dependencies
echo "[1/8] Installing dependencies..."
pnpm install

# 2. Start PostgreSQL
echo "[2/8] Starting PostgreSQL..."
docker compose up -d
echo "  Waiting for database..."
sleep 5

# 3. Push schema
echo "[3/8] Creating database schema..."
cd packages/database && npx prisma db push && cd ../..

# 4. Seed metadata
echo "[4/8] Seeding countries, themes, indicators..."
pnpm db:seed

# 5. Seed policies
echo "[5/8] Seeding policy data..."
pnpm seed:policies 2>/dev/null || echo "  (policy seed not found, skipping)"

# 6. Seed experts
echo "[6/8] Seeding expert profiles..."
pnpm seed:experts 2>/dev/null || echo "  (expert seed not found, skipping)"

# 7. Import World Bank data
echo "[7/8] Importing World Bank data (this takes 5-10 minutes)..."
pnpm import:worldbank

# 8. Done
echo ""
echo "[8/8] Setup complete!"
echo ""
echo "To start the platform:"
echo "  Backend:  cd apps/api && pnpm dev     -> http://localhost:3001"
echo "  Frontend: pnpm dev                     -> http://localhost:8080"
echo "  Swagger:  http://localhost:3001/api/docs"
echo "  Admin:    admin@africanyouthdatabase.org / AYD@Admin2026!"
echo ""
echo "After both are running, compute indexes:"
echo "  curl -X POST http://localhost:3001/api/youth-index/compute-all"
echo "  curl -X POST http://localhost:3001/api/policy-monitor/compute"
echo "  (Both require admin auth token)"
echo ""
