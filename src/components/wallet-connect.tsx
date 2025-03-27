import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Wallet, ChevronRight, Power, AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export function WalletConnect() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [pendingCheckLoading, setPendingCheckLoading] = useState(false)
  const { toast } = useToast()

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // polling check pending requests
  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const response = await fetch('/api/wallet-connect');
        const data = await response.json();
        
        if (data.success && data.pendingRequests && data.pendingRequests.length > 0) {
          // there are pending requests, get the first one
          const requestId = data.pendingRequests[0];
          
          // get and remove the request
          const requestResponse = await fetch(`/api/wallet-connect?requestId=${requestId}`);
          const requestData = await requestResponse.json();
          
          if (requestData.success && requestData.exists) {
            // find the available injected connector
            const injectedConnector = connectors.find(c => c.name.toLowerCase().includes('injected'));
            
            if (injectedConnector) {
              // trigger connection
              toast({
                title: 'Wallet Connection Requested',
                description: 'Connecting to wallet via MCP...',
              });
              
              connect({ connector: injectedConnector });
            }
          }
        }
      } catch (error) {
        console.error('Failed to check pending wallet requests:', error);
      }
    };
    
    // set polling interval, 3 seconds
    const intervalId = setInterval(checkPendingRequests, 3000);
    
    // clear the timer when the component unmounts
    return () => clearInterval(intervalId);
  }, [connect, connectors, toast]);
  
  // manually check pending connections
  const checkPendingConnections = async () => {
    try {
      setPendingCheckLoading(true);
      
      const response = await fetch('/api/wallet-connect');
      const data = await response.json();
      
      if (data.success && data.count > 0) {
        toast({
          title: 'Pending Connections',
          description: `Found ${data.count} pending wallet connection requests.`,
        });
      } else {
        toast({
          title: 'No Pending Connections',
          description: 'No wallet connection requests found.',
        });
      }
    } catch (error) {
      console.error('Failed to check pending connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to check pending connections.',
        variant: 'destructive',
      });
    } finally {
      setPendingCheckLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xs shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Wallet</CardTitle>
          {account.status === 'connected' && (
            <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          )}
          {account.status === 'disconnected' && (
            <Badge variant="outline" className="px-3 py-1 bg-gray-50 text-gray-500 border-gray-200">
              Disconnected
            </Badge>
          )}
          {account.status === 'connecting' && (
            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
              Connecting...
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your wallet to access the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {account.status === 'connected' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 border-2 border-500 rounded-lg flex items-center justify-center bg-gray-200">
                <Wallet className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Connected Account</p>
                <p className="text-xs text-muted-foreground">
                  {account.addresses?.map(truncateAddress).join(', ') || 'No address available'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => disconnect()}>
                <Power className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Chain ID</span>
                <span className="text-sm">{account.chainId}</span>
              </div>
            </div>
          </div>
        )}

        {account.status === 'disconnected' && (
          <div className="space-y-3">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full justify-between"
                variant="outline"
              >
                <span className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  {connector.name}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ))}
            
            <Button
              onClick={checkPendingConnections}
              className="w-full justify-center"
              variant="ghost"
              disabled={pendingCheckLoading}
            >
              <span className="flex items-center">
                <RefreshCw className={`mr-2 h-4 w-4 ${pendingCheckLoading ? 'animate-spin' : ''}`} />
                Check Pending Connections
              </span>
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}
      </CardContent>
      
      {status === 'pending' && (
        <CardFooter>
          <div className="w-full bg-muted/50 rounded-lg p-4 text-center">
            <div className="animate-pulse">Connecting to wallet...</div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 