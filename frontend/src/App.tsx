import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { CONTRACTS, NETWORK } from './config'
import ROUTER_ABI from './abis/router.json'
import ERC20_ABI from './abis/erc20.json'

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [activeTab, setActiveTab] = useState<'swap' | 'pool' | 'lock'>('swap')
  
  // Swap state
  const [tokenIn, setTokenIn] = useState('ETH')
  const [tokenOut, setTokenOut] = useState(CONTRACTS.WETH)
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [swapping, setSwapping] = useState(false)

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum)
      setProvider(p)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x10e6' }]
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x10e6',
                chainName: NETWORK.chainName,
                rpcUrls: NETWORK.rpcUrls,
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: NETWORK.blockExplorerUrls
              }]
            })
          }
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  const getQuote = async () => {
    if (!provider || !amountIn || parseFloat(amountIn) === 0) return
    
    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, provider)
      const path = tokenIn === 'ETH' 
        ? [CONTRACTS.WETH, tokenOut]
        : tokenOut === 'ETH'
        ? [tokenIn, CONTRACTS.WETH]
        : [tokenIn, tokenOut]
      
      const amountInWei = ethers.parseEther(amountIn)
      const amounts = await router.getAmountsOut(amountInWei, path)
      setAmountOut(ethers.formatEther(amounts[1]))
    } catch (error) {
      console.error('Quote error:', error)
    }
  }

  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0) {
      const timer = setTimeout(() => getQuote(), 500)
      return () => clearTimeout(timer)
    }
  }, [amountIn, tokenIn, tokenOut])

  const handleSwap = async () => {
    if (!provider || !account) return
    
    setSwapping(true)
    try {
      const signer = await provider.getSigner()
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer)
      const deadline = Math.floor(Date.now() / 1000) + 1200
      const amountInWei = ethers.parseEther(amountIn)
      const amountOutMin = ethers.parseEther((parseFloat(amountOut) * 0.99).toString())
      
      let tx
      if (tokenIn === 'ETH') {
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          [CONTRACTS.WETH, tokenOut],
          account,
          deadline,
          { value: amountInWei, gasLimit: 300000 }
        )
      } else {
        tx = await router.swapExactTokensForETH(
          amountInWei,
          amountOutMin,
          [tokenIn, CONTRACTS.WETH],
          account,
          deadline,
          { gasLimit: 300000 }
        )
      }
      
      await tx.wait()
      alert('Swap successful!')
      setAmountIn('')
      setAmountOut('')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="App">
      <header>
        <h1>🚀 MegaSwap DEX</h1>
        <button onClick={connectWallet} className="connect-btn">
          {account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      <main>
        <div className="tabs">
          <button 
            className={activeTab === 'swap' ? 'active' : ''} 
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </button>
          <button 
            className={activeTab === 'pool' ? 'active' : ''} 
            onClick={() => setActiveTab('pool')}
          >
            Pool
          </button>
          <button 
            className={activeTab === 'lock' ? 'active' : ''} 
            onClick={() => setActiveTab('lock')}
          >
            Lock
          </button>
        </div>

        {activeTab === 'swap' && (
          <div className="card swap-card">
            <h2>Swap Tokens</h2>
            
            <div className="input-group">
              <label>From</label>
              <input 
                type="number" 
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
              />
              <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)}>
                <option value="ETH">ETH</option>
              </select>
            </div>

            <div className="swap-arrow">↓</div>

            <div className="input-group">
              <label>To</label>
              <input 
                type="number" 
                placeholder="0.0"
                value={amountOut}
                readOnly
              />
              <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)}>
                <option value={CONTRACTS.WETH}>WETH</option>
              </select>
            </div>

            <button 
              className="swap-btn" 
              onClick={handleSwap}
              disabled={!account || swapping || !amountIn}
            >
              {!account ? 'Connect Wallet' : swapping ? 'Swapping...' : 'Swap'}
            </button>
          </div>
        )}

        {activeTab === 'pool' && (
          <div className="card">
            <h2>Liquidity Pools</h2>
            <p>Pool functionality coming soon!</p>
            <p>Use the Router contract directly at:</p>
            <code>{CONTRACTS.ROUTER}</code>
          </div>
        )}

        {activeTab === 'lock' && (
          <div className="card">
            <h2>LP Token Locker</h2>
            <p>Lock functionality coming soon!</p>
            <p>Use the Locker contract directly at:</p>
            <code>{CONTRACTS.LOCKER}</code>
          </div>
        )}

        <div className="info-box">
          <h3>📋 Contract Addresses</h3>
          <p><strong>Router:</strong> <code>{CONTRACTS.ROUTER}</code></p>
          <p><strong>Factory:</strong> <code>{CONTRACTS.FACTORY}</code></p>
          <p><strong>Locker:</strong> <code>{CONTRACTS.LOCKER}</code></p>
          <p><strong>Explorer:</strong> <a href="https://megaeth.blockscout.com" target="_blank">megaeth.blockscout.com</a></p>
        </div>
      </main>
    </div>
  )
}

export default App
