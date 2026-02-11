import { ethers } from 'ethers';
//@ts-ignore
import ERC20_ABI from '@/abis/erc20.json';

export async function checkApproval(provider: any, tokenAddress: string, owner: string, spender: string): Promise<bigint> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.allowance(owner, spender);
}

export async function approveToken(provider: any, tokenAddress: string, spender: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.approve(spender, ethers.MaxUint256);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Approval error:', error);
    return false;
  }
}

export async function getTokenBalance(provider: any, tokenAddress: string, account: string): Promise<string> {
  if (tokenAddress === 'ETH') {
    const balance = await provider.getBalance(account);
    return ethers.formatEther(balance);
  }
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(account);
  return ethers.formatUnits(balance, 18);
}

export async function fetchTokenInfo(tokenAddress: string) { 
  return null; 
}

export async function fetchDexScreenerPrice(tokenAddress: string) { 
  return null; 
}

export async function getSwapQuote(provider: any, tokenIn: string, tokenOut: string, amountIn: string) {
  return null;
}

export async function executeSwap(provider: any, tokenIn: string, tokenOut: string, amountIn: string, amountOutMin: string, account: string) {
  return null;
}

export async function getPairInfo(provider: any, tokenA: string, tokenB: string) {
  return null;
}

export async function addLiquidity(provider: any, tokenA: string, tokenB: string, amountA: string, amountB: string, account: string) {
  return null;
}

export async function removeLiquidity(provider: any, tokenA: string, tokenB: string, liquidity: string, account: string) {
  return null;
}

export async function createLock(provider: any, token: string, amount: string, unlockTime: number, account: string) {
  return null;
}

export async function withdrawLock(provider: any, lockId: number, account: string) {
  return null;
}

export async function getUserLocks(provider: any, account: string) {
  return [];
}

export async function getTokenLocks(provider: any, tokenAddress: string) {
  return [];
}
