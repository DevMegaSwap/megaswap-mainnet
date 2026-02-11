"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_TOKENS } from '@/config';
import { fetchTokenInfo, getTokenBalance } from '@/lib/blockchain';
import ERC20_ABI from '@/abis/erc20.json';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: any) => void;
  provider: ethers.BrowserProvider | null;
  account: string;
}

export default function TokenModal({ isOpen, onClose, onSelectToken, provider, account }: TokenModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customTokens, setCustomTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Load custom tokens from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customTokens');
      if (saved) {
        setCustomTokens(JSON.parse(saved));
      }
    }
  }, []);

  // Fetch balances for all tokens
  useEffect(() => {
    if (!provider || !account) return;

    const fetchBalances = async () => {
      const allTokens = [...DEFAULT_TOKENS, ...customTokens];
      const newBalances: Record<string, string> = {};

      for (const token of allTokens) {
        try {
          const balance = await getTokenBalance(provider, token.address, account);
          newBalances[token.address] = balance;
        } catch (error) {
          newBalances[token.address] = "0";
        }
      }

      setBalances(newBalances);
    };

    fetchBalances();
  }, [provider, account, customTokens]);

  const handleImportToken = async () => {
    if (!provider || !searchQuery || !ethers.isAddress(searchQuery)) {
      alert("Invalid address");
      return;
    }

    setLoading(true);

    try {
      // Try to fetch from DexScreener first
      const dexScreenerInfo = await fetchTokenInfo(searchQuery);
      
      // Fallback to blockchain
      const tokenContract = new ethers.Contract(searchQuery, ERC20_ABI, provider);
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);

      const newToken = {
        address: searchQuery,
        symbol: dexScreenerInfo?.symbol || symbol,
        name: dexScreenerInfo?.name || name,
        decimals: Number(decimals),
        logoURI: dexScreenerInfo?.logoURI || "",
        socials: dexScreenerInfo?.socials || []
      };

      // Check if already exists
      const exists = [...DEFAULT_TOKENS, ...customTokens].some(
        t => t.address.toLowerCase() === searchQuery.toLowerCase()
      );

      if (exists) {
        alert("Token already imported");
        return;
      }

      const updated = [...customTokens, newToken];
      setCustomTokens(updated);
      localStorage.setItem('customTokens', JSON.stringify(updated));
      
      setSearchQuery("");
      alert("Token imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import token");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectToken = (token: any) => {
    onSelectToken(token);
    onClose();
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const allTokens = [...DEFAULT_TOKENS, ...customTokens];
  const filteredTokens = allTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Select Token</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or paste address"
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
            />
            {ethers.isAddress(searchQuery) && (
              <button
                onClick={handleImportToken}
                disabled={loading}
                className="px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-opacity-90 disabled:bg-gray-300"
              >
                {loading ? "..." : "Import"}
              </button>
            )}
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {ethers.isAddress(searchQuery) 
                ? "Click Import to add this token"
                : "No tokens found"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelectToken(token)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Logo */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {token.logoURI ? (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-gray-500 font-semibold">
                        {token.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                    {token.socials && token.socials.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {token.socials.slice(0, 3).map((social: any, idx: number) => (
                          <a
                            key={idx}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {social.type}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatBalance(balances[token.address] || "0")}
                    </div>
                    <div className="text-xs text-gray-500">{token.symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
