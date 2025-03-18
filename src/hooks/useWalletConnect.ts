import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useCallback } from 'react';

type WalletState = {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
};

export function useWalletConnect() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const { address, isConnected } = useAccount();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = useCallback(async (connectorId?: string) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId) || connectors[0]
        : connectors[0];
        
      await connect({ connector });
      
      // 在wagmi的connect回调中不会立即有地址，需要等待account hook更新
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        address: address || null,
      }));
      
      return { 
        success: true, 
        address: address || null 
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : connectError?.message || 'Failed to connect wallet';
        
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [address, connect, connectors, connectError]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setState({
      address: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    
    return { success: true };
  }, [disconnect]);

  // 更新state以反映最新的wagmi状态
  if (isConnected && address && !state.isConnected) {
    setState({
      address,
      isConnected: true,
      isConnecting: false,
      error: null,
    });
  } else if (!isConnected && state.isConnected) {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }

  return {
    address: state.address,
    isConnecting: state.isConnecting,
    isConnected: state.isConnected,
    error: state.error || connectError?.message || null,
    connectors,
    connectWallet,
    disconnectWallet,
  };
} 