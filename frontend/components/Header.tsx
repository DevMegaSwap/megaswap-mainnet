"use client";

import { useState } from 'react';

interface HeaderProps {
  account: string;
  isConnected: boolean;
  isCorrectChain: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export default function Header({
  account,
  isConnected,
  isCorrectChain,
  onConnect,
  onDisconnect,
  onSwitchNetwork
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MegaSwap
            </h1>
          </div>

          {/* Network & Wallet */}
          <div className="flex items-center gap-3">
            {/* Network Status */}
            {isConnected && (
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                isCorrectChain 
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
              }`}
              onClick={!isCorrectChain ? onSwitchNetwork : undefined}
              >
                {isCorrectChain ? "MegaETH" : "Wrong Network"}
              </div>
            )}

            {/* Connect/Account Button */}
            {!isConnected ? (
              <button
                onClick={onConnect}
                className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-opacity-90 transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold">{formatAddress(account)}</span>
                  <span className="text-gray-500">▼</span>
                </button>

                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account);
                          setShowDropdown(false);
                          alert("Address copied!");
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        📋 Copy Address
                      </button>
                      
                        href={`https://megaeth.blockscout.com/address/${account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        🔍 View on Explorer
                      </a>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={() => {
                          onDisconnect();
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        🚪 Disconnect
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
