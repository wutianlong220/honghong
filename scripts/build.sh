#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" npx next build

echo "Build completed successfully!"
echo "Output directory: .next/"
