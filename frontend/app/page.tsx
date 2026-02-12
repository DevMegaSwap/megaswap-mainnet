"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { MEGAETH_NETWORK } from "@/config";
import WalletModal from "@/components/WalletModal";
import TokenModal from "@/components/TokenModal";
import SwapCard from "@/components/SwapCard";
import PoolCard from "@/components/PoolCard";
import LockCard from "@/components/LockCard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("swap");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenModalMode, setTokenModalMode] = useState("in");
  
  const [tokenIn, setTokenIn] = useState<any>({ address: "ETH", symbol: "ETH", name: "Ether", decimals: 18 });
  const [tokenOut, setTokenOut] = useState<any>(null);
  const [poolTokenA, setPoolTokenA] = useState<any>({ address: "ETH", symbol: "ETH", name: "Ether", decimals: 18 });
  const [poolTokenB, setPoolTokenB] = useState<any>(null);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setProvider(provider);
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MEGAETH_NETWORK.chainId }],
          });
        } catch (error: any) {
          if (error.code === 4902) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [MEGAETH_NETWORK],
            });
          }
        }
      } catch (error) {
        console.error("Failed:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const openTokenModal = (mode: string) => {
    if (mode === "swap") {
      const temp = tokenIn;
      setTokenIn(tokenOut);
      setTokenOut(temp);
      return;
    }
    setTokenModalMode(mode);
    setShowTokenModal(true);
  };

  const handleTokenSelect = (token: any) => {
    if (tokenModalMode === "in") setTokenIn(token);
    else if (tokenModalMode === "out") setTokenOut(token);
    else if (tokenModalMode === "pA") setPoolTokenA(token);
    else if (tokenModalMode === "pB") setPoolTokenB(token);
  };

  const getSelectedTokens = () => {
    const selected: string[] = [];
    if (tokenModalMode === "in" && tokenOut) selected.push(tokenOut.address);
    if (tokenModalMode === "out" && tokenIn) selected.push(tokenIn.address);
    if (tokenModalMode === "pA" && poolTokenB) selected.push(poolTokenB.address);
    if (tokenModalMode === "pB" && poolTokenA) selected.push(poolTokenA.address);
    return selected;
  };

  return (
    <div>
      <div className="dc dc1">🍰</div>
      <div className="dc dc2">🤖</div>
      <header className="hdr">
        <a href="#" className="logo">
          <div className="logo-i">🍰</div>
          <span className="logo-t">MegaSwap</span>
        </a>
        <nav className="nav">
          <button className={activeTab === "swap" ? "nav-l on" : "nav-l"} onClick={() => setActiveTab("swap")}>Swap</button>
          <button className={activeTab === "pool" ? "nav-l on" : "nav-l"} onClick={() => setActiveTab("pool")}>Pool</button>
          <button className={activeTab === "lock" ? "nav-l on" : "nav-l"} onClick={() => setActiveTab("lock")}>🔒 Lock</button>
          <a href="https://megaeth.blockscout.com" target="_blank" rel="noopener noreferrer" className="nav-l">Explorer ↗</a>
        </nav>
        <div className="hdr-r">
          <div className="chain"><span className="dot"></span>MegaETH Mainnet</div>
          {account ? (
            <button className="wbtn" onClick={() => setAccount("")}><span className="dot"></span>{account.slice(0, 6)}...{account.slice(-4)}</button>
          ) : (
            <button className="cbtn" onClick={() => setShowWalletModal(true)}>Connect Wallet</button>
          )}
        </div>
      </header>
      <div className="main">
        <div className="hero">
          <div className="hero-m">
            <span className="m1">🍰</span>
            <span className="m2">⚡</span>
            <span className="m3">🤖</span>
          </div>
          <h1>MegaSwap</h1>
          <p>The real-time DEX on MegaETH</p>
        </div>
        {activeTab === "swap" && <SwapCard account={account} provider={provider} onOpenTokenModal={openTokenModal} tokenIn={tokenIn} tokenOut={tokenOut} />}
        {activeTab === "pool" && <PoolCard account={account} provider={provider} onOpenTokenModal={openTokenModal} tokenA={poolTokenA} tokenB={poolTokenB} />}
        {activeTab === "lock" && <LockCard account={account} provider={provider} />}
      </div>
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} onConnect={connectWallet} />
      <TokenModal isOpen={showTokenModal} onClose={() => setShowTokenModal(false)} onSelect={handleTokenSelect} selectedTokens={getSelectedTokens()} account={account} provider={provider} />
    </div>
  );
}
