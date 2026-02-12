"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { CONTRACTS } from "@/config";
import ROUTER_ABI from "@/abis/router.json";
import ERC20_ABI from "@/abis/erc20.json";

export default function SwapCard({ account, provider, onOpenTokenModal, tokenIn, tokenOut }: any) {
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [status, setStatus] = useState("");

  const balanceIn = useTokenBalance(account, tokenIn?.address, provider);
  const balanceOut = useTokenBalance(account, tokenOut?.address, provider);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amountIn && tokenIn && tokenOut && provider && parseFloat(amountIn) > 0) {
        fetchQuote();
      } else {
        setAmountOut("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [amountIn, tokenIn, tokenOut, provider]);

  const fetchQuote = async () => {
    try {
      setQuoting(true);
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, provider);
      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
      
      const path = [
        tokenIn.address === "ETH" ? CONTRACTS.WETH : tokenIn.address,
        tokenOut.address === "ETH" ? CONTRACTS.WETH : tokenOut.address
      ];

      const amounts = await router.getAmountsOut(amountInWei, path);
      const out = ethers.formatUnits(amounts[1], tokenOut.decimals);
      setAmountOut(out);
    } catch (error) {
      console.error("Quote error:", error);
      setAmountOut("0");
    } finally {
      setQuoting(false);
    }
  };

  const handleSwap = async () => {
    if (!account || !provider || !tokenIn || !tokenOut || !amountIn || !amountOut || parseFloat(amountOut) === 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing swap...");
      
      const signer = await provider.getSigner();
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      
      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
      const amountOutWei = ethers.parseUnits(amountOut, tokenOut.decimals);
      const minAmountOut = (amountOutWei * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      
      const path = [
        tokenIn.address === "ETH" ? CONTRACTS.WETH : tokenIn.address,
        tokenOut.address === "ETH" ? CONTRACTS.WETH : tokenOut.address
      ];

      if (tokenIn.address === "ETH") {
        setStatus("Swapping...");
        const tx = await router.swapExactETHForTokens(
          minAmountOut,
          path,
          account,
          deadline,
          { value: amountInWei, gasLimit: 300000n }
        );
        await tx.wait();
      } else if (tokenOut.address === "ETH") {
        setStatus("Approving token...");
        const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, CONTRACTS.ROUTER);
        
        if (allowance < amountInWei) {
          const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }
        
        setStatus("Swapping...");
        const tx = await router.swapExactTokensForETH(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          { gasLimit: 300000n }
        );
        await tx.wait();
      } else {
        setStatus("Approving token...");
        const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, CONTRACTS.ROUTER);
        
        if (allowance < amountInWei) {
          const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }
        
        setStatus("Swapping...");
        const tx = await router.swapExactTokensForTokens(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          { gasLimit: 300000n }
        );
        await tx.wait();
      }
      
      setStatus("✅ Swap successful!");
      setAmountIn("");
      setAmountOut("");
      setTimeout(() => setStatus(""), 3000);
    } catch (error: any) {
      console.error("Swap error:", error);
      let errorMsg = "Unknown error";
      if (error.reason) errorMsg = error.reason;
      else if (error.message) errorMsg = error.message.substring(0, 100);
      setStatus("❌ Swap failed: " + errorMsg);
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getTokenIcon = (symbol: string) => {
    if (!symbol) return "?";
    if (symbol === "ETH" || symbol === "WETH") return "Ξ";
    if (symbol === "MCOIN") return "🍰";
    if (symbol === "FLUFF") return "🤖";
    return symbol.charAt(0);
  };

  const getTokenBg = (symbol: string) => {
    if (!symbol) return "linear-gradient(135deg,#666,#888)";
    if (symbol === "ETH" || symbol === "WETH") return "linear-gradient(135deg,#627eea,#8c9eff)";
    if (symbol === "MCOIN") return "linear-gradient(135deg,var(--purple),var(--pink))";
    if (symbol === "FLUFF") return "linear-gradient(135deg,#00c853,#69f0ae)";
    return "linear-gradient(135deg,var(--purple),var(--pink))";
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num === 0) return "0.00";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(6);
    return num.toFixed(4);
  };

  const formatAmount = (val: string) => {
    if (!val) return "";
    const num = parseFloat(val);
    if (num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";
    if (num < 0.01) return num.toFixed(8);
    if (num < 1) return num.toFixed(6);
    return num.toFixed(4);
  };

  return (
    <>
      <div className={`sett ${showSettings ? "open" : ""}`}>
        <div className="sett-lab">Slippage Tolerance</div>
        <div className="slip-ops">
          <button className={`sbtn ${slippage === 0.1 ? "on" : ""}`} onClick={() => setSlippage(0.1)}>0.1%</button>
          <button className={`sbtn ${slippage === 0.5 ? "on" : ""}`} onClick={() => setSlippage(0.5)}>0.5%</button>
          <button className={`sbtn ${slippage === 1 ? "on" : ""}`} onClick={() => setSlippage(1)}>1.0%</button>
        </div>
      </div>
      <div className="card">
        <div className="card-h">
          <span className="card-t">Swap</span>
          <button className="gbtn" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
        </div>
        <div className="tib">
          <div className="tib-lab">
            <span>You pay</span>
            <span>Balance: {formatBalance(balanceIn)} <span className="max" onClick={() => setAmountIn(balanceIn)}>MAX</span></span>
          </div>
          <div className="tib-row">
            <input className="amt" type="text" placeholder="0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
            {tokenIn ? (
              <button className="ts" onClick={() => onOpenTokenModal("in")}>
                <span className="ti" style={{ background: getTokenBg(tokenIn.symbol) }}>{getTokenIcon(tokenIn.symbol)}</span>
                {tokenIn.symbol}
                <span className="chv">▾</span>
              </button>
            ) : (
              <button className="ts empty" onClick={() => onOpenTokenModal("in")}>Select Token</button>
            )}
          </div>
        </div>
        <div className="sdiv"><button className="sarr" onClick={() => onOpenTokenModal("swap")}>↓</button></div>
        <div className="tib">
          <div className="tib-lab">
            <span>You receive</span>
            <span>Balance: {formatBalance(balanceOut)}</span>
          </div>
          <div className="tib-row">
            <input 
              className="amt" 
              type="text" 
              placeholder="0" 
              value={quoting ? "..." : formatAmount(amountOut)} 
              readOnly 
            />
            {tokenOut ? (
              <button className="ts" onClick={() => onOpenTokenModal("out")}>
                <span className="ti" style={{ background: getTokenBg(tokenOut.symbol) }}>{getTokenIcon(tokenOut.symbol)}</span>
                {tokenOut.symbol}
                <span className="chv">▾</span>
              </button>
            ) : (
              <button className="ts empty" onClick={() => onOpenTokenModal("out")}>Select Token</button>
            )}
          </div>
        </div>
        {amountIn && tokenIn && tokenOut && amountOut && parseFloat(amountOut) > 0 && (
          <div className="pi">
            <div className="pr"><span>Rate</span><span className="v">1 {tokenIn.symbol} = {formatAmount((parseFloat(amountOut) / parseFloat(amountIn)).toString())} {tokenOut.symbol}</span></div>
            <div className="pr"><span>Slippage</span><span className="v">{slippage}%</span></div>
            <div className="pr"><span>Min. received</span><span className="v">{formatAmount((parseFloat(amountOut) * (1 - slippage / 100)).toString())} {tokenOut.symbol}</span></div>
          </div>
        )}
        {status && (
          <div style={{ 
            padding: "12px", 
            borderRadius: "12px", 
            background: status.includes("✅") ? "rgba(0,230,118,.1)" : status.includes("❌") ? "rgba(255,82,82,.1)" : "rgba(123,63,228,.1)",
            border: status.includes("✅") ? "1px solid rgba(0,230,118,.3)" : status.includes("❌") ? "1px solid rgba(255,82,82,.3)" : "1px solid rgba(123,63,228,.3)",
            color: "var(--text)",
            fontSize: "13px",
            textAlign: "center",
            marginTop: "10px"
          }}>
            {status}
          </div>
        )}
        <button 
          className={`abtn ${account && !loading && tokenIn && tokenOut && amountIn && parseFloat(amountOut) > 0 ? "pri" : "dis"}`} 
          disabled={!account || loading || !tokenIn || !tokenOut || !amountIn || parseFloat(amountOut) <= 0}
          onClick={handleSwap}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span className="spin"></span> Swapping...
            </span>
          ) : !account ? "Connect Wallet" : !tokenIn || !tokenOut ? "Select tokens" : !amountIn ? "Enter amount" : quoting ? "Getting quote..." : parseFloat(amountOut) <= 0 ? "Insufficient liquidity" : "Swap"}
        </button>
      </div>
    </>
  );
}
