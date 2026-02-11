#!/bin/bash
set -e

echo "🚀 Deploying to MegaETH Mainnet..."

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set"
    echo "Run: export PRIVATE_KEY='0xyour_key_here'"
    exit 1
fi

cd "$(dirname "$0")"

forge install foundry-rs/forge-std --no-commit 2>/dev/null || true

forge script script/DeployMainnet.s.sol:DeployMainnet \
  --rpc-url https://mainnet.megaeth.io/rpc \
  --broadcast \
  --skip-simulation \
  --legacy

echo ""
echo "✅ Deployment complete!"
echo "📋 Copy the addresses above to frontend/config/index.ts"
