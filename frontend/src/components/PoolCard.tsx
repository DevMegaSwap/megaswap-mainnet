"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { CONTRACTS } from "@/config";
import ROUTER_ABI from "@/abis/router.json";
import FACTORY_ABI from "@/abis/factory.json";
import PAIR_ABI from "@/abis/pair.json";
import ERC20_ABI from "@/abis/erc20.json";

export default function PoolCard({ account, provider, onOpenTokenModal, tokenA, tokenB }: any) {
  const [mode, setMode] = useState("add");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [pairExists, setPairExists] = useState(false);
  const [reserves, setReserves] = useState({ reserve0: "0", reserve1: "0" });
  const [lpBalance, setLpBalance] = useState("0.00");

  const balanceA = useTokenBalance(account, tokenA?.address, provider);
  const balanceB = useTokenBalance(account, tokenB?.address, provider);

  useEffect(() => {
    if (tokenA && tokenB && provider) {
      checkPair();
    }
  }, [tokenA, tokenB, provider, account]);

  useEffect(() => {
    if (pairExists && tokenA && tokenB && reserves.reserve0 !== "0" && amountA) {
      calculateAmountB();
    }
  }, [amountA, pairExists, reserves]);

  const checkPair = async () => {
    try {
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      const addrA = tokenA.address === "ETH" ? CONTRACTS.WETH : tokenA.address;
      const addrB = tokenB.address === "ETH" ? CONTRACTS.WETH : tokenB.address;
      
      const pairAddress = await factory.getPair(addrA, addrB);
      
      if (pairAddress !== ethers.ZeroAddress) {
        setPairExists(true);
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        
        if (token0.toLowerCase() === addrA.toLowerCase()) {
          setReserves({ reserve0: reserve0.toString(), reserve1: reserve1.toString() });
        } else {
          setReserves({ reserve0: reserve1.toString(), reserve1: reserve0.toString() });
        }
        
        if (account) {
          const balance = await pair.balanceOf(account);
          setLpBalance(ethers.formatEther(balance));
        }
      } else {
        setPairExists(false);
        setReserves({ reserve0: "0", reserve1: "0" });
      }
    } catch (error) {
      console.error("Check pair error:", error);
      setPairExists(false);
    }
  };

  const calculateAmountB = () => {
    if (!amountA || parseFloat(amountA) === 0) {
      setAmountB("");
      return;
    }
    
    const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
    const reserve0 = BigInt(reserves.reserve0);
    const reserve1 = BigInt(reserves.reserve1);
    
    if (reserve0 > 0n && reserve1 > 0n) {
      const amountBWei = (amountAWei * reserve1) / reserve0;
      setAmountB(ethers.formatUnits(amountBWei, tokenB.decimals));
    }
  };

  const handleAddLiquidity = async () => {
    if (!account || !provider || !tokenA || !tokenB || !amountA || !amountB) {
      alert("Please fill all fields");
      return;
    }

    if (parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      alert("Amounts must be greater than 0");
      return;
    }

    if (parseFloat(amountA) > parseFloat(balanceA)) {
      alert(`Insufficient ${tokenA.symbol} balance`);
      return;
    }
    if (parseFloat(amountB) > parseFloat(balanceB)) {
      alert(`Insufficient ${tokenB.symbol} balance`);
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      
      const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
      const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
      
      const minAmountA = (amountAWei * 99n) / 100n;
      const minAmountB = (amountBWei * 99n) / 100n;
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      if (tokenA.address === "ETH") {
        setStatus("Approving token...");
        const tokenContract = new ethers.Contract(tokenB.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, CONTRACTS.ROUTER);
        
        if (allowance < amountBWei) {
          const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }

        setStatus("Adding liquidity...");
        const tx = await router.addLiquidityETH(
          tokenB.address,
          amountBWei,
          amountBWei,
          0,
          account,
          deadline,
          { 
            value: amountAWei,
            gasLimit: 500000n
          }
        const tx = await router.addLiquidityETH(
          tokenB.address,
          amountBWei,
          minAmountB,
          minAmountA,
          account,
          deadline,
        await checkPair();
        setTimeout(() => setStatus(""), 3000);
        
      } else if (tokenB.address === "ETH") {
        setStatus("Approving token...");
        const tokenContract = new ethers.Contract(tokenA.address, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account, CONTRACTS.ROUTER);
        
        if (allowance < amountAWei) {
          const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }

        setStatus("Adding liquidity...");
        const tx = await router.addLiquidityETH(
          tokenA.address,
        const tx = await router.addLiquidityETH(
          tokenA.address,
          amountAWei,
          minAmountA,
          minAmountB,
          account,
          deadline,
            value: amountBWei,
            gasLimit: 500000n
          }
        );
        await tx.wait();
        
        setStatus("✅ Liquidity added!");
        setAmountA("");
        setAmountB("");
        await checkPair();
        setTimeout(() => setStatus(""), 3000);
        
      } else {
        setStatus("Approving tokens...");
        const tokenAContract = new ethers.Contract(tokenA.address, ERC20_ABI, signer);
        const tokenBContract = new ethers.Contract(tokenB.address, ERC20_ABI, signer);
        
        const allowanceA = await tokenAContract.allowance(account, CONTRACTS.ROUTER);
        const allowanceB = await tokenBContract.allowance(account, CONTRACTS.ROUTER);
        
        if (allowanceA < amountAWei) {
          const approveTx = await tokenAContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }
        
        if (allowanceB < amountBWei) {
          const approveTx = await tokenBContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }

        setStatus("Adding liquidity...");
        const tx = await router.addLiquidity(
          tokenA.address,
          tokenB.address,
          amountAWei,
          amountBWei,
          0,
          amountBWei,
          account,
          deadline,
          { gasLimit: 500000n }
        );
        await tx.wait();
        
        setStatus("✅ Liquidity added!");
        setAmountA("");
        setAmountB("");
        await checkPair();
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (error: any) {
      console.error("Full error:", error);
      let errorMsg = "Transaction failed";
      
      if (error.message) {
        if (error.message.includes("insufficient funds")) {
          errorMsg = "Insufficient ETH for gas";
        } else if (error.message.includes("user rejected")) {
          errorMsg = "Transaction rejected";
        } else {
          errorMsg = error.message.substring(0, 100);
        }
      }
      
      setStatus("❌ " + errorMsg);
      setTimeout(() => setStatus(""), 8000);
    } finally {
      setLoading(false);
    }
  };

  const getTokenIcon = (symbol: string) => {
    if (symbol === "ETH" || symbol === "WETH") return "Ξ";
    if (symbol === "MCOIN") return "🍰";
    if (symbol === "FLUFF") return "🤖";
    return symbol.charAt(0);
  };

  const getTokenBg = (symbol: string) => {
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

  return (
    <div className="card">
      <div className="card-h">
        <span className="card-t">Pool</span>
      </div>
      <div className="ptabs">
        <button className={`ptab ${mode === "add" ? "on" : ""}`} onClick={() => setMode("add")}>Add Liquidity</button>
        <button className={`ptab ${mode === "remove" ? "on" : ""}`} onClick={() => setMode("remove")}>Remove</button>
      </div>
      {mode === "add" && (
        <>
          <div className="tib">
            <div className="tib-lab">
              <span>Token A</span>
              <span>Balance: {formatBalance(balanceA)}</span>
            </div>
            <div className="tib-row">
              <input className="amt amt-s" type="text" placeholder="0" value={amountA} onChange={(e) => setAmountA(e.target.value)} />
              {tokenA ? (
                <button className="ts" onClick={() => onOpenTokenModal("pA")}>
                  <span className="ti" style={{ background: getTokenBg(tokenA.symbol) }}>{getTokenIcon(tokenA.symbol)}</span>
                  {tokenA.symbol}
                  <span className="chv">▾</span>
                </button>
              ) : (
                <button className="ts empty" onClick={() => onOpenTokenModal("pA")}>Select</button>
              )}
            </div>
          </div>
          <div className="pplus">+</div>
          <div className="tib">
            <div className="tib-lab">
              <span>Token B</span>
              <span>Balance: {formatBalance(balanceB)}</span>
            </div>
            <div className="tib-row">
              <input className="amt amt-s" type="text" placeholder="0" value={amountB} onChange={(e) => setAmountB(e.target.value)} readOnly={pairExists} />
              {tokenB ? (
                <button className="ts" onClick={() => onOpenTokenModal("pB")}>
                  <span className="ti" style={{ background: getTokenBg(tokenB.symbol) }}>{getTokenIcon(tokenB.symbol)}</span>
                  {tokenB.symbol}
                  <span className="chv">▾</span>
                </button>
              ) : (
                <button className="ts empty" onClick={() => onOpenTokenModal("pB")}>Select</button>
              )}
            </div>
          </div>
          {pairExists && <div className="pst">✓ Pool exists</div>}
          {amountA && amountB && tokenA && tokenB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && (
            <div className="lpi">
              <div className="lpr">
                <span className="l">Pool share</span>
                <span className="val">{pairExists ? "~0.01%" : "100% (New)"}</span>
              </div>
              <div className="lpr">
                <span className="l">{tokenA.symbol} per {tokenB.symbol}</span>
                <span className="val">{(parseFloat(amountA) / parseFloat(amountB)).toFixed(6)}</span>
              </div>
              <div className="lpr">
                <span className="l">{tokenB.symbol} per {tokenA.symbol}</span>
                <span className="val">{(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)}</span>
              </div>
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
            className={`abtn ${account && !loading ? "pri" : "dis"}`} 
            disabled={!account || loading}
            onClick={handleAddLiquidity}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span className="spin"></span> Processing...
              </span>
            ) : account ? "Add Liquidity" : "Connect Wallet"}
          </button>
        </>
      )}
    </div>
  );
}
