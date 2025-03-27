'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState, useEffect } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { initMcpClient } from '@/services/mcp-client-browser'

import { getConfig } from '@/wagmi'

export function Providers(props: {
  children: ReactNode
  initialState?: State
}) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())
  const [isMcpInitialized, setIsMcpInitialized] = useState(false)
  const [mcpError, setMcpError] = useState<string | null>(null)

  // Initialize MCP client
  useEffect(() => {
    const initializeMcp = async () => {
      try {
        const success = await initMcpClient();
        setIsMcpInitialized(success);
        if (!success) {
          setMcpError('Failed to initialize MCP client');
        }
      } catch (error) {
        console.error('Error initializing MCP client:', error);
        setMcpError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeMcp();
  }, []);

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
