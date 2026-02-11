"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_TOKENS, CONTRACTS } from '@/config';
import { getSwapQuote, checkApproval, approveToken, executeSwap } from '@/lib/blockchain';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useTokenPrice } from '@/hooks/useTokenPrice';

interface SwapCardProps {
  provider: ethers.BrowserProvider | null;
  account: string;
  onOpenTokenModal: (callback: (token: any) => void) => void;
}

export default function SwapCard({ provider, account, onOpenTokenModal }: SwapCardProps) {
  const [tokenIn, setTokenIn] = useState(DEFAULT_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(DEFAULT_TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  const { balance: balanceIn } = useTokenBalance(provider, tokenIn.address, account);
  const { balance: balanceOut } = useTokenBalance(provider, tokenOut.address, account);
  const { priceData: priceIn } = useTokenPrice(tokenIn.address);
  const { priceData: priceOut } = useTokenPrice(tokenOut.address);

  // Check approval when amount or token changes
  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!provider || !amountIn || !account || tokenIn.address === "ETH") {
        setNeedsApproval(false);
        return;
      }

      try {
        const amountWei = ethers.parseUnits(amountIn, tokenIn.decimals);
        const allowance = await checkApproval(provider, tokenIn.address, account, CONTRACTS.ROUTER);
        setNeedsApproval(allowance < amountWei);
      } catch (error) {
        console.error("Approval check error:", error);
        setNeedsApproval(true);
      }
    };

    checkApprovalStatus();
  }, [provider, tokenIn, amountIn, account]);

  // Fetch quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!provider || !amountIn || parseFloat(amountIn) <= 0) {
        setAmountOut("");
        return;
      }

      setQuoteLoading(true);
      try {
        const quote = await getSwapQuote(provider, tokenIn, tokenOut, amountIn);
        setAmountOut(quote);
      } catch (error) {
        console.error("Quote error:", error);
        setAmountOut("0");
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [provider, tokenIn, tokenOut, amountIn]);

  const handleFlipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const handleApprove = async () => {
    if (!provider || tokenIn.address === "ETH") return;

    setApproving(true);
    setError("");

    try {
      const success = await approveToken(provider, tokenIn.address, CONTRACTS.ROUTER);
      if (success) {
        setNeedsApproval(false);
      } else {
        setError("Approval failed");
      }
    } catch (error: any) {
      console.error("Approval error:", error);
      setError(error.message || "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!provider || !amountIn || !amountOut) return;

    setLoading(true);
    setError("");

    try {
      const result = await executeSwap(
        provider,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        account,
        slippage
      );

      if (result.success) {
        setAmountIn("");
        setAmountOut("");
        alert("Swap successful!");
      } else {
        setError(result.error || "Swap failed");
      }
    } catch (error: any) {
      console.error("Swap error:", error);
      setError(error.message || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Swap</h2>
        <button
          onClick={() => {/* Settings modal */}}
          className="text-gray-500 hover:text-gray-700"
        >
          ⚙️
        </button>
      </div>

      {/* Token In */}
      <div className="bg-gray-50 rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">You pay</span>
          <span className="text-sm text-gray-500">
            Balance: {formatBalance(balanceIn)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-semibold outline-none"
          />
          <button
            onClick={() => onOpenTokenModal(setTokenIn)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-full hover:bg-gray-100"
          >
            {tokenIn.logoURI && (
              <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
            )}
            <span className="font-semibold">{tokenIn.symbol}</span>
            <span>▼</span>
          </button>
        </div>
        {priceIn && (
          <div className="mt-2 text-sm text-gray-500">
            ${priceIn.priceUsd} 
            <span className={parseFloat(priceIn.priceChange24h) >= 0 ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
              {parseFloat(priceIn.priceChange24h) >= 0 ? "+" : ""}{parseFloat(priceIn.priceChange24h).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Flip Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleFlipTokens}
          className="bg-white border-4 border-gray-50 rounded-xl p-2 hover:bg-gray-100"
        >
          ↕️
        </button>
      </div>

      {/* Token Out */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">You receive</span>
          <span className="text-sm text-gray-500">
            Balance: {formatBalance(balanceOut)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={quoteLoading ? "Loading..." : amountOut}
            readOnly
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-semibold outline-none"
          />
          <button
            onClick={() => onOpenTokenModal(setTokenOut)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-full hover:bg-gray-100"
          >
            {tokenOut.logoURI && (
              <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
            )}
            <span className="font-semibold">{tokenOut.symbol}</span>
            <span>▼</span>
          </button>
        </div>
        {priceOut && (
          <div className="mt-2 text-sm text-gray-500">
            ${priceOut.priceUsd}
            <span className={parseFloat(priceOut.priceChange24h) >= 0 ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
              {parseFloat(priceOut.priceChange24h) >= 0 ? "+" : ""}{parseFloat(priceOut.priceChange24h).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Slippage */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Slippage Tolerance</span>
          <div className="flex gap-2">
            {[0.5, 1, 3].map((val) => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  slippage === val ? "bg-primary text-white" : "bg-white text-gray-700"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Approve Button (separate) */}
      {needsApproval && tokenIn.address !== "ETH" && (
        <button
          onClick={handleApprove}
          disabled={approving}
          className="w-full bg-secondary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed mb-3"
        >
          {approving ? "Approving..." : `Approve ${tokenIn.symbol}`}
        </button>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={loading || !amountIn || !amountOut || needsApproval || !account}
        className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Swapping..." : !account ? "Connect Wallet" : needsApproval ? "Approve First" : "Swap"}
      </button>
    </div>
  );
}
