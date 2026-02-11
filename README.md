# 🚀 MegaSwap - Complete DEX on MegaETH Mainnet

Production-ready decentralized exchange with:
- ✅ Token swaps with DexScreener price integration
- ✅ Add/Remove liquidity with dual approvals
- ✅ LP token locking
- ✅ Token import with logo fetching
- ✅ Complete Uniswap V2 fork

## Quick Start

### 1. Deploy Contracts
```bash
cd contracts
export PRIVATE_KEY="0xyour_mainnet_private_key"
./deploy.sh
```

**Save all deployed addresses!**

### 2. Configure Frontend

Edit `frontend/config/index.ts`:
```typescript
export const CONTRACTS = {
  FACTORY: "0xYOUR_FACTORY",
  ROUTER: "0xYOUR_ROUTER",
  LOCKER: "0xYOUR_LOCKER",
  WETH: "0x4200000000000000000000000000000000000006"
};

export const INIT_CODE_HASH = "0xYOUR_INIT_CODE_HASH";
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## 📁 Structure
```
megaswap-mainnet/
├── contracts/           # Solidity contracts
│   ├── src/            # 5 contracts (Factory, Router, Pair, Locker, ERC20)
│   ├── script/         # Deployment script
│   └── deploy.sh       # One-command deploy
├── frontend/           # Next.js 14 + TypeScript
│   ├── components/     # SwapCard, PoolCard, LockCard, etc.
│   ├── hooks/          # useWeb3, useTokenBalance, useTokenPrice
│   ├── lib/            # Blockchain interaction
│   ├── config/         # Configuration
│   └── abis/           # Contract ABIs
└── README.md
```

---

## 🎯 Features

### Swap
- Real-time quotes
- DexScreener price display
- Separate approve button
- Slippage settings
- Balance checking

### Pool
- Add/Remove liquidity tabs
- Dual token approvals
- LP balance display
- Percentage removal (25/50/75/100%)
- Pool share calculation

### Lock
- Lock LP tokens
- Search locks by token
- Duration presets
- Withdraw when unlocked

### Token Import
- Auto-fetch from DexScreener
- Logo & socials display
- Balance display
- Custom token storage

---

## 🌐 Network

- **Mainnet RPC:** https://mainnet.megaeth.com/rpc
- **Chain ID:** 4326 (0x10e6)
- **Explorer:** https://megaeth.blockscout.com
- **WETH:** 0x4200000000000000000000000000000000000006

---

## 💰 Gas Costs

- Factory: ~0.01 ETH
- Router: ~0.015 ETH
- Locker: ~0.005 ETH
- **Total: ~0.03 ETH**

---

## 🚀 Deploy to Production
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Vercel/Netlify
# Or serve with:
npm start
```

---

## ✅ Complete Checklist

- [x] 5 Solidity contracts
- [x] Deployment script
- [x] Complete frontend
- [x] Separate approve flows
- [x] DexScreener integration
- [x] Token import
- [x] LP locking
- [x] Remove liquidity
- [x] Production styling
- [x] MetaMask integration

**NOTHING IS MISSING. PRODUCTION READY.**

Built for MegaETH Mainnet 🚀
