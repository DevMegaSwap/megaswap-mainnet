"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/config';
import { checkApproval, approveToken } from '@/lib/blockchain';
import LOCKER_ABI from '@/abis/locker.json';

interface LockCardProps {
  provider: ethers.BrowserProvider | null;
  account: string;
}

export default function LockCard({ provider, account }: LockCardProps) {
  const [activeTab, setActiveTab] = useState<"create" | "search">("create");
  
  // Create lock state
  const [lpTokenAddress, setLpTokenAddress] = useState("");
  const [lockAmount, setLockAmount] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [locking, setLocking] = useState(false);
  
  // Search state
  const [searchAddress, setSearchAddress] = useState("");
  const [locks, setLocks] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [error, setError] = useState("");
  const [lockFee, setLockFee] = useState("0.05");

  // Fetch lock fee
  useEffect(() => {
    const fetchLockFee = async () => {
      if (!provider) return;
      
      try {
        const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, provider);
        const fee = await locker.lockFee();
        setLockFee(ethers.formatEther(fee));
      } catch (error) {
        console.error("Fee fetch error:", error);
      }
    };

    fetchLockFee();
  }, [provider]);

  // Check approval
  useEffect(() => {
    const checkLockApproval = async () => {
      if (!provider || !lpTokenAddress || !lockAmount || !account) {
        setNeedsApproval(false);
        return;
      }

      try {
        const amountWei = ethers.parseUnits(lockAmount, 18);
        const allowance = await checkApproval(provider, lpTokenAddress, account, CONTRACTS.LOCKER);
        setNeedsApproval(allowance < amountWei);
      } catch (error) {
        console.error("Approval check error:", error);
        setNeedsApproval(true);
      }
    };

    if (activeTab === "create") {
      checkLockApproval();
    }
  }, [provider, lpTokenAddress, lockAmount, account, activeTab]);

  const handleApprove = async () => {
    if (!provider) return;

    setApproving(true);
    setError("");

    try {
      const success = await approveToken(provider, lpTokenAddress, CONTRACTS.LOCKER);
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

  const handleLock = async () => {
    if (!provider || !lpTokenAddress || !lockAmount || !unlockDate) return;

    setLocking(true);
    setError("");

    try {
      const signer = await provider.getSigner();
      const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, signer);
      
      const amountWei = ethers.parseUnits(lockAmount, 18);
      const unlockTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
      const feeWei = ethers.parseEther(lockFee);

      const tx = await locker.lockLPToken(lpTokenAddress, amountWei, unlockTimestamp, {
        value: feeWei,
        gasLimit: 300000n
      });
      
      await tx.wait();
      
      setLpTokenAddress("");
      setLockAmount("");
      setUnlockDate("");
      alert("LP tokens locked successfully!");
    } catch (error: any) {
      console.error("Lock error:", error);
      setError(error.reason || error.message || "Lock failed");
    } finally {
      setLocking(false);
    }
  };

  const handleSearch = async () => {
    if (!provider || !searchAddress) return;

    setSearching(true);
    setError("");

    try {
      const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, provider);
      const lockIds = await locker.getLocksByLPToken(searchAddress);
      
      const lockDetails = await Promise.all(
        lockIds.map(async (id: bigint) => {
          const lock = await locker.locks(id);
          return {
            id: id.toString(),
            owner: lock.owner,
            amount: ethers.formatUnits(lock.amount, 18),
            lockDate: new Date(Number(lock.lockDate) * 1000).toLocaleDateString(),
            unlockDate: new Date(Number(lock.unlockDate) * 1000).toLocaleDateString(),
            withdrawn: lock.withdrawn
          };
        })
      );

      setLocks(lockDetails);
    } catch (error: any) {
      console.error("Search error:", error);
      setError(error.message || "Search failed");
      setLocks([]);
    } finally {
      setSearching(false);
    }
  };

  const handleWithdraw = async (lockId: string) => {
    if (!provider) return;

    try {
      const signer = await provider.getSigner();
      const locker = new ethers.Contract(CONTRACTS.LOCKER, LOCKER_ABI, signer);
      
      const tx = await locker.withdrawLPToken(lockId, { gasLimit: 200000n });
      await tx.wait();
      
      alert("Withdrawal successful!");
      handleSearch(); // Refresh locks
    } catch (error: any) {
      console.error("Withdraw error:", error);
      alert(error.reason || error.message || "Withdrawal failed");
    }
  };

  const getQuickUnlockDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-3 rounded-xl font-semibold ${
            activeTab === "create"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Create Lock
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-3 rounded-xl font-semibold ${
            activeTab === "search"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Search Locks
        </button>
      </div>

      {activeTab === "create" ? (
        <>
          {/* LP Token Address */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">LP Token Address</label>
            <input
              type="text"
              value={lpTokenAddress}
              onChange={(e) => setLpTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Lock Amount */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Amount to Lock</label>
            <input
              type="text"
              value={lockAmount}
              onChange={(e) => setLockAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Unlock Date */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Unlock Date</label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
            />
            
            {/* Quick date buttons */}
            <div className="flex gap-2 mt-2">
              {[
                { label: "1 Week", days: 7 },
                { label: "1 Month", days: 30 },
                { label: "6 Months", days: 180 },
                { label: "1 Year", days: 365 }
              ].map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => setUnlockDate(getQuickUnlockDate(preset.days))}
                  className="flex-1 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lock Fee Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lock Fee:</span>
              <span className="font-semibold">{lockFee} ETH</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Approve Button */}
          {needsApproval && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 mb-2"
            >
              {approving ? "Approving..." : "Approve LP Token"}
            </button>
          )}

          {/* Lock Button */}
          <button
            onClick={handleLock}
            disabled={locking || !lpTokenAddress || !lockAmount || !unlockDate || needsApproval || !account}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {locking ? "Locking..." : !account ? "Connect Wallet" : needsApproval ? "Approve First" : "Lock LP Tokens"}
          </button>
        </>
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">LP Token Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchAddress}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Locks List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {locks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No locks found
              </div>
            ) : (
              locks.map((lock) => (
                <div key={lock.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-500">Lock #{lock.id}</div>
                      <div className="font-bold text-lg">{parseFloat(lock.amount).toFixed(4)} LP</div>
                    </div>
                    {lock.withdrawn ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        Withdrawn
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Locked:</span>
                      <span>{lock.lockDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unlocks:</span>
                      <span className="font-semibold">{lock.unlockDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Owner:</span>
                      <span className="font-mono text-xs">
                        {lock.owner.slice(0, 6)}...{lock.owner.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {!lock.withdrawn && lock.owner.toLowerCase() === account.toLowerCase() && (
                    <button
                      onClick={() => handleWithdraw(lock.id)}
                      disabled={new Date(lock.unlockDate) > new Date()}
                      className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {new Date(lock.unlockDate) > new Date() ? "Locked" : "Withdraw"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
