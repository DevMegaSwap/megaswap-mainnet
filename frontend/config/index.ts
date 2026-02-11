export const MAINNET_CHAIN_ID = 4326;

export const CONTRACTS = {
  FACTORY: "PASTE_YOUR_FACTORY_ADDRESS_HERE",
  ROUTER: "PASTE_YOUR_ROUTER_ADDRESS_HERE",
  LOCKER: "PASTE_YOUR_LOCKER_ADDRESS_HERE",
  WETH: "0x4200000000000000000000000000000000000006"
};

export const MAINNET_NETWORK = {
  chainId: "0x10e6",
  chainName: "MegaETH",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["https://mainnet.megaeth.com/rpc"],
  blockExplorerUrls: ["https://megaeth.blockscout.com"]
};

export const DEFAULT_TOKENS = [
  {
    address: "ETH",
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/ETH/logo.png"
  },
  {
    address: CONTRACTS.WETH,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/WETH/logo.png"
  }
];

export const INIT_CODE_HASH = "PASTE_YOUR_INIT_CODE_HASH_HERE";

export const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex";
