#!/bin/bash
set -e

echo "🚀 Deploying to MegaETH Mainnet..."

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set"
    echo "Run: export PRIVATE_KEY='0xyour_key_here'"
    exit 1
fi

cd "$(dirname "$0")"

forge install foundry-rs/forge-std --no-git 2>/dev/null || true

echo ""
echo "⚠️  IMPORTANT: After deployment, run this command:"
echo "   cast call <FACTORY_ADDRESS> 'setFeeTo(address)' <YOUR_ADDRESS> --rpc-url https://mainnet.megaeth.com/rpc --private-key \$PRIVATE_KEY"
echo ""
echo "   This enables the 0.05% protocol fee to YOUR address!"
echo ""

forge script script/DeployMainnet.s.sol:DeployMainnet \
  --rpc-url https://mainnet.megaeth.com/rpc \
  --broadcast \
  --skip-simulation \
  --gas-limit 30000000 \
  --legacy

echo ""
echo "✅ Deployment complete!"
echo "📋 Copy the addresses above to frontend/config/index.ts"
echo ""
echo "🔧 CRITICAL: Set feeTo address with:"
echo "   cast send <FACTORY_ADDRESS> 'setFeeTo(address)' <YOUR_ADDRESS> --rpc-url https://mainnet.megaeth.com/rpc --private-key \$PRIVATE_KEY"
