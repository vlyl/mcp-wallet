'use client'

import { WalletConnect } from '@/components/wallet-connect'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChatBox } from '@/components/chat-box'
import { McpStatus } from '@/components/mcp-status'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">MCP Wallet</h1>
          <p className="text-muted-foreground">Connect your wallet to get started</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
          <div className="flex flex-col gap-6 w-full lg:w-auto">
            <WalletConnect />
            <McpStatus />
          </div>
          <div className="w-full lg:flex-1">
            <ChatBox />
          </div>
        </div>
        
        <footer className="text-center text-sm text-muted-foreground mt-12">
          <p>Powered by Wagmi & Next.js</p>
        </footer>
      </div>
    </main>
  )
}
