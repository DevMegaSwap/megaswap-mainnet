"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, DEFAULT_TOKENS } from "@/config";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import ERC20_ABI from "@/abis/erc20.json";

export default function TokenModal({ isOpen, onClose, onSelect, selectedTokens = [], account, provider }: any) {
  const [search, setSearch] = useState("");
  const [customToken, setCustomToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importedTokens, setImportedTokens] = useState<any[]>([]);

  useEffect(() => {
    const handleEscape = (e: any) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (search.length === 42 && search.startsWith("0x") && provider && account) {
      checkCustomToken(search);
    } else {
      setCustomToken(null);
    }
  }, [search, provider]);

  const checkCustomToken = async (address: string) => {
    try {
      setLoading(true);
      
      // Try to create contract and fetch token info directly
      const contract = new ethers.Contract(address, ERC20_ABI, provider);
      
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals()
      ]);

      const token = {
        address,
        symbol,
        name,
        decimals: Number(decimals),
        custom: true
      };

      setCustomToken(token);
    } catch (error) {
      console.error("Error checking token:", error);
      setCustomToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (token: any) => {
    const exists = importedTokens.find((t: any) => t.address.toLowerCase() === token.address.toLowerCase());
    if (!exists) {
      setImportedTokens([...importedTokens, token]);
    }
    onSelect(token);
    onClose();
    setSearch("");
    setCustomToken(null);
  };

  const allTokens = [...DEFAULT_TOKENS, ...importedTokens];

  const filteredTokens = allTokens.filter(
    (t: any) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  const getTokenIcon = (token: any) => {
    if (token.symbol === "ETH") return "Ξ";
    if (token.symbol === "WETH") return "Ξ";
    if (token.symbol === "DUCK") return "🦆";
    return token.symbol.charAt(0);
  };

  const getTokenBg = (token: any) => {
    if (token.symbol === "ETH" || token.symbol === "WETH") return "linear-gradient(135deg,#627eea,#8c9eff)";
    if (token.symbol === "DUCK") return "linear-gradient(135deg,#ffd740,#ffa726)";
    return "linear-gradient(135deg,var(--purple),var(--pink))";
  };

  return (
    <div className={`mod ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className="mod-c" onClick={(e) => e.stopPropagation()}>
        <div className="mod-h">
          <span className="mod-t">Select Token</span>
          <button className="mod-x" onClick={onClose}>✕</button>
        </div>
        <div className="mod-b">
          <input 
            type="text" 
            className="tsrch" 
            placeholder="Search name or paste address (0x...)" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            autoFocus 
          />

          {loading && (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--dim)" }}>
              <span className="spin"></span> Checking token...
            </div>
          )}

          {customToken && !loading && (
            <div style={{ 
              padding: "12px", 
              background: "rgba(255,215,64,.1)", 
              border: "1px solid rgba(255,215,64,.3)", 
              borderRadius: "12px", 
              marginBottom: "12px" 
            }}>
              <div style={{ fontSize: "13px", color: "var(--yellow)", marginBottom: "8px" }}>
                ⚠️ Unknown token
              </div>
              <div className="tli" style={{ background: "var(--card)", marginBottom: "8px" }}>
                <div className="tli-i">
                  <span className="ti" style={{ background: getTokenBg(customToken) }}>
                    {getTokenIcon(customToken)}
                  </span>
                </div>
                <div className="tli-info">
                  <div className="tli-n">{customToken.symbol}</div>
                  <div className="tli-s">{customToken.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--dim)", marginTop: "2px" }}>
                    {customToken.address.slice(0, 10)}...{customToken.address.slice(-8)}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleImport(customToken)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "linear-gradient(135deg,var(--purple),var(--pink))",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "var(--font)"
                }}
              >
                Import Token
              </button>
            </div>
          )}

          {!customToken && !loading && search.length === 42 && search.startsWith("0x") && (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--dim)", fontSize: "13px" }}>
              Token not found at this address
            </div>
          )}

          {(!search || search.length < 42) && filteredTokens.map((token: any) => (
            <TokenRow
              key={token.address}
              token={token}
              account={account}
              provider={provider}
              isDisabled={selectedTokens.includes(token.address)}
              onSelect={() => {
                onSelect(token);
                onClose();
                setSearch("");
              }}
              getTokenIcon={getTokenIcon}
              getTokenBg={getTokenBg}
            />
          ))}

          {filteredTokens.length === 0 && !loading && !customToken && search && search.length < 42 && (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--dim)", fontSize: "13px" }}>
              No tokens found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TokenRow({ token, account, provider, isDisabled, onSelect, getTokenIcon, getTokenBg }: any) {
  const balance = useTokenBalance(account, token.address, provider);

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num === 0) return "0.00";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(6);
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(2) + "K";
    return num.toFixed(4);
  };

  return (
    <div
      className="tli"
      onClick={isDisabled ? undefined : onSelect}
      style={{
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      <div className="tli-i">
        <span className="ti" style={{ background: getTokenBg(token) }}>
          {getTokenIcon(token)}
        </span>
      </div>
      <div className="tli-info">
        <div className="tli-n">
          {token.symbol}
          {token.custom && (
            <span style={{ 
              marginLeft: "6px", 
              fontSize: "9px", 
              background: "rgba(255,215,64,.2)", 
              color: "var(--yellow)", 
              padding: "2px 6px", 
              borderRadius: "4px" 
            }}>
              IMPORTED
            </span>
          )}
        </div>
        <div className="tli-s">{token.name}</div>
      </div>
      <div className="tli-bal">
        <div className="tli-b">{formatBalance(balance)}</div>
      </div>
    </div>
  );
}
