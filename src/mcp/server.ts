#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


// Create server instance
const server = new McpServer({
  name: "wallet",
  version: "1.0.0",
});

// 钱包连接状态
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

// 服务器主程序
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wallet MCP Server running on stdio");
}

// 调用API端点连接钱包
async function callWalletConnectApi(address: string) {
  try {
    // 本地开发环境下API URL
    const apiUrl = 'http://localhost:3000/api/wallet-connect';
    
    // 发起HTTP请求
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
    
    // 如果提供了地址且连接成功，调用API
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

// 仅在直接运行脚本时执行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}

// 导出函数供API路由使用
export { connectWallet, disconnectWallet, getWalletState };