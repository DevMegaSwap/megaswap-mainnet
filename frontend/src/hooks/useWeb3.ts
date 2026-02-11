"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MAINNET_CHAIN_ID, MAINNET_NETWORK } from '@/config';

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0] || "");
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connect = async () => {
    if (!provider) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== MAINNET_CHAIN_ID) {
        await switchToMainnet();
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const switchToMainnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MAINNET_NETWORK.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MAINNET_NETWORK],
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      }
    }
  };

  const disconnect = () => {
    setAccount("");
  };

  return {
    provider,
    account,
    chainId,
    isConnected: !!account,
    isCorrectChain: chainId === MAINNET_CHAIN_ID,
    connect,
    disconnect,
    switchToMainnet
  };
}
