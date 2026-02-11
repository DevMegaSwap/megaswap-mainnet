"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_TOKENS, CONTRACTS } from '@/config';
import { checkApproval, approveToken, addLiquidity, removeLiquidity, getPairInfo } from '@/lib/blockchain';
import { useTokenBalance } from '@/hooks/useTokenBalance';

interface PoolCardProps {
  provider: ethers.BrowserProvider | null;
  account: string;
  onOpenTokenModal: (callback: (token: any) => void) => void;
}

export default function PoolCard({ provider, account, onOpenTokenModal }: PoolCardProps) {
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add");
  
  // Add liquidity state
  const [tokenA, setTokenA] = useState(DEFAULT_TOKENS[0]);
  const [tokenB, setTokenB] = useState(DEFAULT_TOKENS[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  
  // Approval state
  const [needsApprovalA, setNeedsApprovalA] = useState(false);
  const [needsApprovalB, setNeedsApprovalB] = useState(false);
  const [approvingA, setApprovingA] = useState(false);
  const [approvingB, setApprovingB] = useState(false);
  
  // Remove liquidity state
  const [removeAmount, setRemoveAmount] = useState("");
  const [removePercentage, setRemovePercentage] = useState(0);
  
  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pairInfo, setPairInfo] = useState<any>(null);

  const { balance: balanceA } = useTokenBalance(provider, tokenA.address, account);
  const { balance: balanceB } = useTokenBalance(provider, tokenB.address, account);

  // Fetch pair info
  useEffect(() => {
    const fetchPairInfo = async () => {
      if (!provider) return;
      
      try {
        const info = await getPairInfo(provider, tokenA, tokenB);
        setPairInfo(info);
      } catch (error) {
        console.error("Pair info error:", error);
        setPairInfo(null);
      }
    };

    fetchPairInfo();
    const interval = setInterval(fetchPairInfo, 10000);
    return () => clearInterval(interval);
  }, [provider, tokenA, tokenB]);

  // Check approvals for add liquidity
  useEffect(() => {
    const checkApprovals = async () => {
      if (!provider || !amountA || !amountB || !account) {
        setNeedsApprovalA(false);
        setNeedsApprovalB(false);
        return;
      }

      try {
        if (tokenA.address !== "ETH") {
          const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
          const allowanceA = await checkApproval(provider, tokenA.address, account, CONTRACTS.ROUTER);
          setNeedsApprovalA(allowanceA < amountAWei);
        } else {
          setNeedsApprovalA(false);
        }

        if (tokenB.address !== "ETH") {
          const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
          const allowanceB = await checkApproval(provider, tokenB.address, account, CONTRACTS.ROUTER);
          setNeedsApprovalB(allowanceB < amountBWei);
        } else {
          setNeedsApprovalB(false);
        }
      } catch (error) {
        console.error("Approval check error:", error);
      }
    };

    if (activeTab === "add") {
      checkApprovals();
    }
  }, [provider, tokenA, tokenB, amountA, amountB, account, activeTab]);

  // Check LP token approval for remove
  useEffect(() => {
    const checkLPApproval = async () => {
      if (!provider || !removeAmount || !account || !pairInfo?.pairAddress) {
        setNeedsApprovalA(false);
        return;
      }

      try {
        const removeWei = ethers.parseUnits(removeAmount, 18);
        const allowance = await checkApproval(provider, pairInfo.pairAddress, account, CONTRACTS.ROUTER);
        setNeedsApprovalA(allowance < removeWei);
      } catch (error) {
        console.error("LP approval check error:", error);
      }
    };

    if (activeTab === "remove") {
      checkLPApproval();
    }
  }, [provider, removeAmount, account, pairInfo, activeTab]);

  const handleApproveA = async () => {
    if (!provider || tokenA.address === "ETH") return;

    setApprovingA(true);
    setError("");

    try {
      const success = await approveToken(provider, tokenA.address, CONTRACTS.ROUTER);
      if (success) {
        setNeedsApprovalA(false);
      } else {
        setError("Approval failed");
      }
    } catch (error: any) {
      console.error("Approval error:", error);
      setError(error.message || "Approval failed");
    } finally {
      setApprovingA(false);
    }
  };

  const handleApproveB = async () => {
    if (!provider || tokenB.address === "ETH") return;

    setApprovingB(true);
    setError("");

    try {
      const success = await approveToken(provider, tokenB.address, CONTRACTS.ROUTER);
      if (success) {
        setNeedsApprovalB(false);
      } else {
        setError("Approval failed");
      }
    } catch (error: any) {
      console.error("Approval error:", error);
      setError(error.message || "Approval failed");
    } finally {
      setApprovingB(false);
    }
  };

  const handleApproveLP = async () => {
    if (!provider || !pairInfo?.pairAddress) return;

    setApprovingA(true);
    setError("");

    try {
      const success = await approveToken(provider, pairInfo.pairAddress, CONTRACTS.ROUTER);
      if (success) {
        setNeedsApprovalA(false);
      } else {
        setError("LP approval failed");
      }
    } catch (error: any) {
      console.error("LP approval error:", error);
      setError(error.message || "LP approval failed");
    } finally {
      setApprovingA(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!provider || !amountA || !amountB) return;

    setLoading(true);
    setError("");

    try {
      const result = await addLiquidity(
        provider,
        tokenA,
        tokenB,
        amountA,
        amountB,
        account,
        slippage
      );

      if (result.success) {
        setAmountA("");
        setAmountB("");
        alert("Liquidity added successfully!");
      } else {
        setError(result.error || "Add liquidity failed");
      }
    } catch (error: any) {
      console.error("Add liquidity error:", error);
      setError(error.message || "Add liquidity failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!provider || !removeAmount) return;

    setLoading(true);
    setError("");

    try {
      const result = await removeLiquidity(
        provider,
        tokenA,
        tokenB,
        removeAmount,
        account,
        slippage
      );

      if (result.success) {
        setRemoveAmount("");
        setRemovePercentage(0);
        alert("Liquidity removed successfully!");
      } else {
        setError(result.error || "Remove liquidity failed");
      }
    } catch (error: any) {
      console.error("Remove liquidity error:", error);
      setError(error.message || "Remove liquidity failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (!pairInfo?.lpBalance) return;
    setRemovePercentage(percentage);
    const amount = (parseFloat(pairInfo.lpBalance) * percentage) / 100;
    setRemoveAmount(amount.toString());
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
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("add")}
          className={`flex-1 py-3 rounded-xl font-semibold ${
            activeTab === "add"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab("remove")}
          className={`flex-1 py-3 rounded-xl font-semibold ${
            activeTab === "remove"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      {activeTab === "add" ? (
        <>
          {/* Token A */}
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Token A</span>
              <span className="text-sm text-gray-500">
                Balance: {formatBalance(balanceA)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-semibold outline-none"
              />
              <button
                onClick={() => onOpenTokenModal(setTokenA)}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full hover:bg-gray-100"
              >
                {tokenA.logoURI && (
                  <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-6 h-6 rounded-full" />
                )}
                <span className="font-semibold">{tokenA.symbol}</span>
                <span>▼</span>
              </button>
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center my-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              +
            </div>
          </div>

          {/* Token B */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Token B</span>
              <span className="text-sm text-gray-500">
                Balance: {formatBalance(balanceB)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-semibold outline-none"
              />
              <button
                onClick={() => onOpenTokenModal(setTokenB)}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full hover:bg-gray-100"
              >
                {tokenB.logoURI && (
                  <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-6 h-6 rounded-full" />
                )}
                <span className="font-semibold">{tokenB.symbol}</span>
                <span>▼</span>
              </button>
            </div>
          </div>

          {/* Pool Info */}
          {pairInfo?.exists && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Your LP Balance:</span>
                <span className="font-semibold">{formatBalance(pairInfo.lpBalance || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pool exists:</span>
                <span className="text-green-600 font-semibold">✓ Yes</span>
              </div>
            </div>
          )}

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

          {/* Approve Buttons (separate for each token) */}
          {needsApprovalA && tokenA.address !== "ETH" && (
            <button
              onClick={handleApproveA}
              disabled={approvingA}
              className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 mb-2"
            >
              {approvingA ? "Approving..." : `Approve ${tokenA.symbol}`}
            </button>
          )}

          {needsApprovalB && tokenB.address !== "ETH" && (
            <button
              onClick={handleApproveB}
              disabled={approvingB}
              className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 mb-2"
            >
              {approvingB ? "Approving..." : `Approve ${tokenB.symbol}`}
            </button>
          )}

          {/* Add Liquidity Button */}
          <button
            onClick={handleAddLiquidity}
            disabled={loading || !amountA || !amountB || needsApprovalA || needsApprovalB || !account}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : !account ? "Connect Wallet" : needsApprovalA || needsApprovalB ? "Approve First" : "Add Liquidity"}
          </button>
        </>
      ) : (
        <>
          {/* Remove Liquidity Tab */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => onOpenTokenModal(setTokenA)}
                className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200"
              >
                {tokenA.logoURI && (
                  <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-5 h-5 rounded-full" />
                )}
                <span className="font-semibold text-sm">{tokenA.symbol}</span>
              </button>
              <span className="text-gray-400">+</span>
              <button
                onClick={() => onOpenTokenModal(setTokenB)}
                className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200"
              >
                {tokenB.logoURI && (
                  <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-5 h-5 rounded-full" />
                )}
                <span className="font-semibold text-sm">{tokenB.symbol}</span>
              </button>
            </div>

            {pairInfo?.exists ? (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-500 mb-2">Your LP Balance</div>
                  <div className="text-2xl font-bold">{formatBalance(pairInfo.lpBalance || "0")}</div>
                </div>

                {/* Percentage Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageClick(pct)}
                      className={`py-2 rounded-lg font-semibold ${
                        removePercentage === pct
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-500 mb-2">LP Amount to Remove</div>
                  <input
                    type="text"
                    value={removeAmount}
                    onChange={(e) => {
                      setRemoveAmount(e.target.value);
                      setRemovePercentage(0);
                    }}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold outline-none"
                  />
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

                {/* Approve LP Token */}
                {needsApprovalA && (
                  <button
                    onClick={handleApproveLP}
                    disabled={approvingA}
                    className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 mb-2"
                  >
                    {approvingA ? "Approving..." : "Approve LP Token"}
                  </button>
                )}

                {/* Remove Button */}
                <button
                  onClick={handleRemoveLiquidity}
                  disabled={loading || !removeAmount || needsApprovalA || !account}
                  className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Removing..." : !account ? "Connect Wallet" : needsApprovalA ? "Approve First" : "Remove Liquidity"}
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No liquidity found for this pair
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
