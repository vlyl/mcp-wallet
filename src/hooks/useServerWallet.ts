import { useCallback, useEffect } from 'react';
import { useWalletConnect } from './useWalletConnect';

export function useServerWallet() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    error,
    connectWallet: clientConnectWallet, 
    disconnectWallet: clientDisconnectWallet 
  } = useWalletConnect();

  // when the client wallet connection state changes, sync to the server
  useEffect(() => {
    if (isConnected && address) {
      syncAddressToServer(address);
    }
  }, [isConnected, address]);

  // sync the address to the server
  const syncAddressToServer = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });
      
      if (!response.ok) {
        console.error('Failed to sync wallet address to server');
      }
    } catch (error) {
      console.error('Error syncing wallet address:', error);
    }
  }, []);

  // connect wallet (sync to server after client connection)
  const connectWallet = useCallback(async (connectorId?: string) => {
    const result = await clientConnectWallet(connectorId);
    
    if (result.success && result.address) {
      await syncAddressToServer(result.address);
    }
    
    return result;
  }, [clientConnectWallet, syncAddressToServer]);

  // disconnect wallet (sync to server after client disconnect)
  const disconnectWallet = useCallback(async () => {
    clientDisconnectWallet();
    
    try {
      await fetch('/api/wallet', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error disconnecting wallet on server:', error);
    }
    
    return { success: true };
  }, [clientDisconnectWallet]);

  return {
    address,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
} 