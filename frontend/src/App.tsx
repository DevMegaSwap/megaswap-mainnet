import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { CONTRACTS, NETWORK } from './config'
import SwapCard from './components/SwapCard'

declare global {
  interface Window {
    ethereum?: any
  }
}

function App() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [activeTab, setActiveTab] = useState<'swap' | 'pool' | 'lock'>('swap')

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum)
      setProvider(p)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!')
      return
    }

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
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 MegaSwap DEX</h1>
        <button onClick={connectWallet} className="connect-btn">
          {account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      <main className="main">
        <div className="tabs">
          {(['swap', 'pool', 'lock'] as const).map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="content">
          {activeTab === 'swap' && <SwapCard provider={provider} account={account} />}
          
          {activeTab === 'pool' && (
            <div className="card">
              <h2>💧 Liquidity Pools</h2>
              <p>Add or remove liquidity to earn fees</p>
              <div className="info">
                <p>Router: <code>{CONTRACTS.ROUTER}</code></p>
                <p>Factory: <code>{CONTRACTS.FACTORY}</code></p>
              </div>
            </div>
          )}
          
          {activeTab === 'lock' && (
            <div className="card">
              <h2>🔒 LP Token Locker</h2>
              <p>Lock your LP tokens for trust</p>
              <div className="info">
                <p>Locker: <code>{CONTRACTS.LOCKER}</code></p>
              </div>
            </div>
          )}
        </div>

        <div className="contracts-info">
          <h3>📋 Deployed Contracts</h3>
          <div className="contract-list">
            <div><strong>Factory:</strong> {CONTRACTS.FACTORY}</div>
            <div><strong>Router:</strong> {CONTRACTS.ROUTER}</div>
            <div><strong>Locker:</strong> {CONTRACTS.LOCKER}</div>
          </div>
          <a 
            href={`https://megaeth.blockscout.com/address/${CONTRACTS.ROUTER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer →
          </a>
        </div>
      </main>
    </div>
  )
}

export default App
