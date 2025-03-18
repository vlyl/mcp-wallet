#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Create server instance
const server = new McpServer({
  name: "weather",
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

server.tool(
  "connect-wallet",
  "Connet to a crypto wallet",
  {
    address: z.string().optional().describe("The address of the wallet to connect to")
  },
  async ({ address }) => {
    const result = await connectWallet(address);
    return {
      content: [
        {
          type: "text",
          text: `Connecting to wallet ${result.address}...`
        }
      ]
    }
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