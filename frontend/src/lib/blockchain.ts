import { ethers } from 'ethers';
//@ts-ignore
import ERC20_ABI from '@/abis/erc20.json';
//@ts-ignore
import ROUTER_ABI from '@/abis/router.json';
//@ts-ignore
import FACTORY_ABI from '@/abis/factory.json';
//@ts-ignore
import PAIR_ABI from '@/abis/pair.json';
//@ts-ignore
import LOCKER_ABI from '@/abis/locker.json';
import { CONTRACTS } from '@/config';

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

export async function getSwapQuote(provider: any, tokenIn: any, tokenOut: any, amountIn: string): Promise<string> {
  try {
    const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, provider);
    const path = tokenIn.address === 'ETH' 
      ? [CONTRACTS.WETH, tokenOut.address]
      : tokenOut.address === 'ETH'
      ? [tokenIn.address, CONTRACTS.WETH]
      : [tokenIn.address, tokenOut.address];
    
    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const amounts = await router.getAmountsOut(amountInWei, path);
    return ethers.formatUnits(amounts[1], tokenOut.decimals);
  } catch (error) {
    console.error('Quote error:', error);
    return '0';
  }
}

export async function executeSwap(provider: any, tokenIn: any, tokenOut: any, amountIn: string, amountOutMin: string, account: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 1200;
    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const amountOutMinWei = ethers.parseUnits(amountOutMin, tokenOut.decimals);

    let tx;
    if (tokenIn.address === 'ETH') {
      tx = await router.swapExactETHForTokens(
        amountOutMinWei,
        [CONTRACTS.WETH, tokenOut.address],
        account,
        deadline,
        { value: amountInWei, gasLimit: 300000 }
      );
    } else if (tokenOut.address === 'ETH') {
      tx = await router.swapExactTokensForETH(
        amountInWei,
        amountOutMinWei,
        [tokenIn.address, CONTRACTS.WETH],
        account,
        deadline,
        { gasLimit: 300000 }
      );
    } else {
      tx = await router.swapExactTokensForTokens(
        amountInWei,
        amountOutMinWei,
        [tokenIn.address, tokenOut.address],
        account,
        deadline,
        { gasLimit: 300000 }
      );
    }
    
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Swap error:', error);
    return false;
  }
}

export async function getPairInfo(provider: any, tokenA: string, tokenB: string) {
  try {
    const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    
    if (pairAddress === ethers.ZeroAddress) {
      return null;
    }

    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const reserves = await pair.getReserves();
    const totalSupply = await pair.totalSupply();

    return {
      pairAddress,
      reserve0: ethers.formatEther(reserves[0]),
      reserve1: ethers.formatEther(reserves[1]),
      totalSupply: ethers.formatEther(totalSupply)
    };
  } catch (error) {
    console.error('Pair info error:', error);
    return null;
  }
}

export async function addLiquidity(provider: any, tokenA: any, tokenB: any, amountA: string, amountB: string, account: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
    const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
    const amountAMin = amountAWei * BigInt(99) / BigInt(100);
    const amountBMin = amountBWei * BigInt(99) / BigInt(100);

    let tx;
    if (tokenA.address === 'ETH') {
      tx = await router.addLiquidityETH(
        tokenB.address,
        amountBWei,
        amountBMin,
        amountAMin,
        account,
        deadline,
        { value: amountAWei, gasLimit: 400000 }
      );
    } else if (tokenB.address === 'ETH') {
      tx = await router.addLiquidityETH(
        tokenA.address,
        amountAWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { value: amountBWei, gasLimit: 400000 }
      );
    } else {
      tx = await router.addLiquidity(
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { gasLimit: 400000 }
      );
    }

    await tx.wait();
    return true;
  } catch (error) {
    console.error('Add liquidity error:', error);
    return false;
  }
}

export async function removeLiquidity(provider: any, tokenA: any, tokenB: any, liquidity: string, account: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    const liquidityWei = ethers.parseEther(liquidity);
    const amountAMin = BigInt(0);
    const amountBMin = BigInt(0);

    let tx;
    if (tokenA.address === 'ETH' || tokenB.address === 'ETH') {
      const token = tokenA.address === 'ETH' ? tokenB : tokenA;
      tx = await router.removeLiquidityETH(
        token.address,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { gasLimit: 400000 }
      );
    } else {
      tx = await router.removeLiquidity(
        tokenA.address,
        tokenB.address,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { gasLimit: 400000 }
      );
    }

    await tx.wait();
    return true;
  } catch (error) {
    console.error('Remove liquidity error:', error);
    return false;
  }
}

export async function createLock(provider: any, token: string, amount: string, unlockTime: number, account: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, signer);
    const amountWei = ethers.parseEther(amount);

    const tx = await locker.lock(token, amountWei, unlockTime, {
      value: ethers.parseEther('0.05'),
      gasLimit: 300000
    });

    await tx.wait();
    return true;
  } catch (error) {
    console.error('Lock error:', error);
    return false;
  }
}

export async function withdrawLock(provider: any, lockId: number, account: string): Promise<boolean> {
  try {
    const signer = await provider.getSigner();
    const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, signer);
    const tx = await locker.withdraw(lockId, { gasLimit: 200000 });
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Withdraw error:', error);
    return false;
  }
}

export async function getUserLocks(provider: any, account: string) {
  try {
    const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, provider);
    const locks = await locker.getUserLocks(account);
    return locks;
  } catch (error) {
    console.error('Get locks error:', error);
    return [];
  }
}

export async function getTokenLocks(provider: any, tokenAddress: string) {
  try {
    const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, provider);
    const locks = await locker.getTokenLocks(tokenAddress);
    return locks;
  } catch (error) {
    console.error('Get token locks error:', error);
    return [];
  }
}

export async function fetchTokenInfo(tokenAddress: string) {
  return null;
}

export async function fetchDexScreenerPrice(tokenAddress: string) {
  return null;
}
