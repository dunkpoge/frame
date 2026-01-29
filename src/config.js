// src/config.js - Configuration
export const CONFIG = {
  RPC_URL: "https://sepolia.base.org",
  CHAIN_ID: 84532,
  
  ADDRESSES: {
    NFT: '0x9418fB8bDC0C76Ea6aDd5eAe2c4f1cb22267D767',
    COIN: '0xE49c58649F3bF2d2af85d3013F4691f6299FA7F8',
    STAKING: '0x2A636631F389985Ef14158aC3ff0A0Af5232315d'
  },
  
  CHAIN_INFO: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    currency: "ETH"
  },
  
  PRICE: 0.002, // ETH per NFT
  MAX_SUPPLY: 10000
};

export const NFT_ABI = [
  {
    inputs: [{ name: "quantity", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "saleActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
];