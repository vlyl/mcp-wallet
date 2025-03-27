#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


// Create server instance
const server = new McpServer({
  name: "wallet",
  version: "1.0.0",
});

// wallet connection state
type WalletState = {
  address: string | null;
  isConnected: boolean;
};

let walletState: WalletState = {
  address: null,
  isConnected: false
};

async function connectWallet(address?: string) {
  if (address) {
    walletState = {
      address,
      isConnected: true
    };
    return {
      success: true,
      address
    };
  }
  
  if (walletState.isConnected && walletState.address) {
    return {
      success: true,
      address: walletState.address
    };
  }
  
  return {
    success: false,
    error: "No wallet connected. Connect wallet in client first."
  };
}

async function disconnectWallet() {
  walletState = {
    address: null,
    isConnected: false
  };
  return {
    success: true
  };
}

function getWalletState() {
  return walletState;
}

// server main program
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wallet MCP Server running on stdio");
}

// call the API endpoint to connect wallet
async function callWalletConnectApi(address: string) {
  try {
    // local development API URL
    const apiUrl = 'http://localhost:3000/api/wallet-connect';
    
    // send HTTP request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

server.tool(
  "connect-wallet",
  "Connet to a crypto wallet",
  {
    address: z.string().optional().describe("The address of the wallet to connect to")
  },
  async ({ address }) => {
    const result = await connectWallet(address);
    
    // If address is provided and connection is successful, call API
    if (address && result.success) {
      try {
        const apiResult = await callWalletConnectApi(address);
        
        if (apiResult.success) {
          return {
            content: [
              {
                type: "text",
                text: `Connecting to wallet ${result.address}. I've sent a connection request to the frontend. The wallet interface should prompt you to connect shortly.`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `I've updated the wallet state with address ${result.address}, but couldn't notify the frontend. You may need to click the connect button manually.`
              }
            ]
          };
        }
      } catch (error) {
        console.error("[MCP-SERVER] Error in connect-wallet tool:", error);
        return {
          content: [
            {
              type: "text",
              text: `Connecting to wallet ${result.address}... (Note: API call failed, but internal state updated)`
            }
          ]
        };
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: result.success 
            ? `Connecting to wallet ${result.address}...` 
            : (result.error || "Failed to connect wallet. Please provide a valid address.")
        }
      ]
    };
  }
)

// only execute the main program when running the script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}

// export functions for API routes
export { connectWallet, disconnectWallet, getWalletState };