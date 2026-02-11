import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ERC20_ABI from "@/abis/erc20.json";

export function useTokenBalance(account, tokenAddress, provider) {
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    if (!account || !tokenAddress || !provider) {
      setBalance("0.00");
      return;
    }

    const fetchBalance = async () => {
      try {
        if (tokenAddress === "ETH") {
          const bal = await provider.getBalance(account);
          setBalance(ethers.formatEther(bal));
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const bal = await contract.balanceOf(account);
          setBalance(ethers.formatEther(bal));
        }
      } catch (error) {
        console.error("Balance fetch error:", error);
        setBalance("0.00");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [account, tokenAddress, provider]);

  return balance;
}
