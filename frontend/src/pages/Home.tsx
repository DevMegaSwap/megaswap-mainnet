"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import SwapCard from '@/components/SwapCard';
import PoolCard from '@/components/PoolCard';
import LockCard from '@/components/LockCard';
import TokenModal from '@/components/TokenModal';
import { useWeb3 } from '@/hooks/useWeb3';

export default function Home() {
  const { provider, account, isConnected, isCorrectChain, connect, disconnect, switchToMainnet } = useWeb3();
  
  const [activeTab, setActiveTab] = useState<"swap" | "pool" | "lock">("swap");
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenModalCallback, setTokenModalCallback] = useState<((token: any) => void) | null>(null);

  const openTokenModal = (callback: (token: any) => void) => {
    setTokenModalCallback(() => callback);
    setTokenModalOpen(true);
  };

  const handleTokenSelect = (token: any) => {
    if (tokenModalCallback) {
      tokenModalCallback(token);
    }
    setTokenModalOpen(false);
    setTokenModalCallback(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <Header
        account={account}
        isConnected={isConnected}
        isCorrectChain={isCorrectChain}
        onConnect={connect}
        onDisconnect={disconnect}
        onSwitchNetwork={switchToMainnet}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setActiveTab("swap")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "swap"
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab("pool")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "pool"
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pool
            </button>
            <button
              onClick={() => setActiveTab("lock")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "lock"
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Lock
            </button>
          </div>
        </div>

        {/* Cards Container */}
        <div className="flex justify-center">
          {activeTab === "swap" && (
            <SwapCard
              provider={provider}
              account={account}
              onOpenTokenModal={openTokenModal}
            />
          )}

          {activeTab === "pool" && (
            <PoolCard
              provider={provider}
              account={account}
              onOpenTokenModal={openTokenModal}
            />
          )}

          {activeTab === "lock" && (
            <LockCard
              provider={provider}
              account={account}
            />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">
                Built on MegaETH for instant transactions with minimal fees
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-lg mb-2">Secure & Audited</h3>
              <p className="text-gray-600 text-sm">
                Uniswap V2 fork with battle-tested smart contracts
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-3">💎</div>
              <h3 className="font-bold text-lg mb-2">LP Token Locking</h3>
              <p className="text-gray-600 text-sm">
                Lock liquidity tokens to build trust in your project
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="mb-2">MegaSwap © 2026 | Built on MegaETH</p>
          <div className="flex justify-center gap-6 text-sm">
            
              href="https://megaeth.blockscout.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Explorer
            </a>
            
              href="https://docs.megaeth.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Docs
            </a>
            
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>

      {/* Token Modal */}
      <TokenModal
        isOpen={tokenModalOpen}
        onClose={() => {
          setTokenModalOpen(false);
          setTokenModalCallback(null);
        }}
        onSelectToken={handleTokenSelect}
        provider={provider}
        account={account}
      />
    </div>
  );
}
