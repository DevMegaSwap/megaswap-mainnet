import { ethers } from 'ethers';
import ERC20_ABI from '@/abis/erc20.json';
import ROUTER_ABI from '@/abis/router.json';

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

export async function fetchTokenInfo() { return null; }
export async function fetchDexScreenerPrice() { return null; }
