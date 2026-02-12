"use client";
import { useEffect } from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export default function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    if (typeof window.ethereum !== "undefined") {
      await onConnect();
      onClose();
    } else {
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  return (
    <div className={`mod ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className="mod-c" onClick={(e) => e.stopPropagation()}>
        <div className="mod-h">
          <span className="mod-t">Connect Wallet</span>
          <button className="mod-x" onClick={onClose}>✕</button>
        </div>
        <div className="mod-b">
          <div className="wopt" onClick={handleMetaMaskConnect}>
            <div className="wopt-i">🦊</div>
            <div className="wopt-t">
              <div className="wopt-n">MetaMask</div>
              <div className="wopt-d">Connect with MetaMask browser extension</div>
            </div>
          </div>
          <div className="wopt" onClick={() => window.open("https://www.coinbase.com/wallet", "_blank")}>
            <div className="wopt-i">🔵</div>
            <div className="wopt-t">
              <div className="wopt-n">Coinbase Wallet</div>
              <div className="wopt-d">Connect with Coinbase Wallet</div>
            </div>
          </div>
          <div className="wopt" onClick={() => window.open("https://walletconnect.com/", "_blank")}>
            <div className="wopt-i">🔗</div>
            <div className="wopt-t">
              <div className="wopt-n">WalletConnect</div>
              <div className="wopt-d">Scan with mobile wallet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
