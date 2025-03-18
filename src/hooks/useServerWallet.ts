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

  // 当客户端钱包连接状态改变时，同步到服务器
  useEffect(() => {
    if (isConnected && address) {
      syncAddressToServer(address);
    }
  }, [isConnected, address]);

  // 将地址同步到服务器
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

  // 连接钱包（客户端连接后同步到服务器）
  const connectWallet = useCallback(async (connectorId?: string) => {
    const result = await clientConnectWallet(connectorId);
    
    if (result.success && result.address) {
      await syncAddressToServer(result.address);
    }
    
    return result;
  }, [clientConnectWallet, syncAddressToServer]);

  // 断开钱包连接（客户端断开后同步到服务器）
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