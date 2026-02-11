# 🚀 MegaSwap - DEX on MegaETH Mainnet

**FIXED:** All network parameters corrected to actual MegaETH Mainnet.

## Features

- ✅ 0.3% swap fee (0.25% to LPs + 0.05% to protocol via feeTo)
- ✅ Uniswap V2 AMM
- ✅ LP token locking
- ✅ Complete frontend with MetaMask
- ✅ MegaEVM compatible deployment

---

## Network Info

- **Chain ID:** 4326 (0x10e6)
- **RPC:** https://mainnet.megaeth.com/rpc
- **Explorer:** https://megaeth.blockscout.com
- **WETH:** 0x4200000000000000000000000000000000000006

---

## Quick Deploy

### 1. Deploy Contracts
```bash
cd contracts
export PRIVATE_KEY="0xyour_mainnet_private_key"
./deploy.sh
```

**CRITICAL:** After deployment, set the feeTo address:
```bash
cast send <FACTORY_ADDRESS> 'setFeeTo(address)' <YOUR_ADDRESS> \
  --rpc-url https://mainnet.megaeth.com/rpc \
  --private-key $PRIVATE_KEY
```

This enables the 0.05% protocol fee to your address!

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

**Get INIT_CODE_HASH:**
```bash
cast call <FACTORY_ADDRESS> 'INIT_CODE_HASH()' --rpc-url https://mainnet.megaeth.com/rpc
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Fee Structure

- **Swap Fee:** 0.3% total
  - 0.25% to liquidity providers
  - 0.05% to protocol (via feeTo address)
- **Lock Fee:** 0.05 ETH

---

## Important Notes

1. **MegaEVM Gas Estimation:** Deployment uses `--skip-simulation` and `--gas-limit 30000000` flags as required by MegaETH docs

2. **Set feeTo Address:** After deploying Factory, you MUST call `setFeeTo()` to enable protocol fees

3. **DexScreener:** May not have MegaETH indexed yet. Frontend will work without it (prices from Router)

4. **INIT_CODE_HASH:** Must match in BOTH the deployed Router contract AND the frontend config

---

## Costs

- Factory: ~0.01 ETH
- Router: ~0.015 ETH  
- Locker: ~0.005 ETH
- **Total: ~0.03 ETH**

---

## Structure
```
megaswap-mainnet/
├── contracts/
│   ├── src/
│   │   ├── UniswapV2Factory.sol
│   │   ├── UniswapV2Router02.sol
│   │   ├── UniswapV2Pair.sol (0.3% fee = 0.25% LP + 0.05% protocol)
│   │   ├── UniswapV2ERC20.sol
│   │   └── MegaLocker.sol
│   ├── script/DeployMainnet.s.sol
│   └── deploy.sh
└── frontend/
    ├── components/ (SwapCard, PoolCard, LockCard, etc.)
    ├── hooks/ (useWeb3, useTokenBalance, useTokenPrice)
    ├── lib/ (blockchain.ts)
    └── config/ (network config)
```

---

## Post-Deployment Checklist

- [ ] Deploy all contracts
- [ ] Call `setFeeTo()` on Factory with your address
- [ ] Get INIT_CODE_HASH from Factory
- [ ] Update frontend config with all addresses
- [ ] Test creating a pair
- [ ] Test swaps
- [ ] Test add/remove liquidity
- [ ] Test locking

---

Built for MegaETH Mainnet 🚀
