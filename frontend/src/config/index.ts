export const MAINNET_CHAIN_ID = 4326;

export const MAINNET_NETWORK = {
  chainId: "0x10e6",
  chainName: "MegaETH Mainnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.megaeth.com/rpc"],
  blockExplorerUrls: ["https://megaeth.blockscout.com"],
};

export const MEGAETH_NETWORK = MAINNET_NETWORK;

export const CONTRACTS = {
  FACTORY: "0x6b0eef2bB4Ad9b28abA6cAE3736EF97d7E3F56b4",
  ROUTER: "0xd8c5512a3481Dcc7fEb3F45fEb1CD116753F04b7",
  LOCKER: "0x156Fa0760807eaB00038aF3b44d0305Af19502ea",
  WETH: "0x4200000000000000000000000000000000000006"
};

export const DEFAULT_TOKENS = [
  {
    address: "ETH",
    symbol: "ETH",
    name: "Ether",
    decimals: 18
  },
  {
    address: CONTRACTS.WETH,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18
  }
];
