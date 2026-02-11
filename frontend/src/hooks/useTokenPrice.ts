"use client";

import { useState, useEffect } from 'react';
import { fetchDexScreenerPrice } from '@/lib/blockchain';

export function useTokenPrice(tokenAddress: string | undefined) {
  const [priceData, setPriceData] = useState<{ priceUsd: string; priceChange24h: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tokenAddress || tokenAddress === "ETH") {
      setPriceData(null);
      return;
    }

    const fetchPrice = async () => {
      setLoading(true);
      try {
        const data = await fetchDexScreenerPrice(tokenAddress);
        setPriceData(data);
      } catch (error) {
        console.error("Price fetch error:", error);
        setPriceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  return { priceData, loading };
}
