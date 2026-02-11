import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACTS } from '../config'
import ROUTER_ABI from '../abis/router.json'
import ERC20_ABI from '../abis/erc20.json'

interface SwapCardProps {
  provider: ethers.BrowserProvider | null
  account: string
}

export default function SwapCard({ provider, account }: SwapCardProps) {
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [tokenOut, setTokenOut] = useState(CONTRACTS.WETH)
  const [swapping, setSwapping] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)

  const getQuote = async () => {
    if (!provider || !amountIn || parseFloat(amountIn) === 0) return
    
    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, provider)
      const path = [CONTRACTS.WETH, tokenOut]
      const amountInWei = ethers.parseEther(amountIn)
      const amounts = await router.getAmountsOut(amountInWei, path)
      setAmountOut(ethers.formatEther(amounts[1]))
    } catch (error) {
      console.error('Quote error:', error)
    }
  }

  useEffect(() => {
    if (amountIn) {
      const timer = setTimeout(() => getQuote(), 500)
      return () => clearTimeout(timer)
    }
  }, [amountIn, tokenOut])

  const handleSwap = async () => {
    if (!provider || !account) return
    
    setSwapping(true)
    try {
      const signer = await provider.getSigner()
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer)
      const deadline = Math.floor(Date.now() / 1000) + 1200
      const amountInWei = ethers.parseEther(amountIn)
      const amountOutMin = ethers.parseEther((parseFloat(amountOut) * 0.99).toString())
      
      const tx = await router.swapExactETHForTokens(
        amountOutMin,
        [CONTRACTS.WETH, tokenOut],
        account,
        deadline,
        { value: amountInWei, gasLimit: 300000 }
      )
      
      await tx.wait()
      alert('✅ Swap successful!')
      setAmountIn('')
      setAmountOut('')
    } catch (error: any) {
      alert(error.message || 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="swap-card">
      <h2>💱 Swap Tokens</h2>
      
      <div className="token-input">
        <label>From</label>
        <input 
          type="number" 
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
        <span className="token-label">ETH</span>
      </div>

      <div className="swap-arrow">↓</div>

      <div className="token-input">
        <label>To (estimated)</label>
        <input 
          type="number" 
          placeholder="0.0"
          value={amountOut}
          readOnly
        />
        <span className="token-label">WETH</span>
      </div>

      <button 
        className="action-btn" 
        onClick={handleSwap}
        disabled={!account || swapping || !amountIn}
      >
        {!account ? 'Connect Wallet First' : swapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  )
}
