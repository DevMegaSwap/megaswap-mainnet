"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenBalance } from '@/lib/blockchain';

export function useTokenBalance(
  provider: ethers.BrowserProvider | null,
  tokenAddress: string | undefined,
  account: string
) {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider || !tokenAddress || !account) {
      setBalance("0");
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const bal = await getTokenBalance(provider, tokenAddress, account);
        setBalance(bal);
      } catch (error) {
        console.error("Balance fetch error:", error);
        setBalance("0");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [provider, tokenAddress, account]);

  return { balance, loading };
}
