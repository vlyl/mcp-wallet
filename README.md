# MCP Wallet

![MCP Wallet](/public/images/mcp-wallet-banner.svg)

> **⚠️ WARNING**: This is an experimental project. DO NOT use in production environments. Please manage your API keys and private keys securely.

A modern web application that integrates Model Context Protocol (MCP) with cryptocurrency wallet management, providing a seamless interface for AI-assisted crypto operations.


## Features

- **Cryptocurrency Wallet Integration**: Connect popular wallets using Wagmi and ethers.js
- **AI-Powered Assistant**: Integrated MCP client for AI-driven interactions
- **Conversational Interface**: Chat with the AI assistant to perform crypto operations
- **Connect-Wallet Tool**: AI can help users connect their wallets through natural language
- **Real-time Diagnostics**: System status monitoring with collapsible diagnostic panel
- **Server Rebuilding**: One-click MCP server rebuilding for easy recovery

## Technology Stack

- **Frontend**: Next.js 14 App Router, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **Wallet Integration**: Wagmi, ethers.js
- **AI Integration**: Model Context Protocol (MCP), Anthropic Claude API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Anthropic API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vlyl/mcp-wallet.git
   cd mcp-wallet
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_WC_PROJECT_ID=your_wallet_connect_project_id
   NEXT_TELEMETRY_DISABLED=1
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Build the MCP server:
   ```bash
   pnpm build:mcp-server
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Your Wallet**: Use the wallet connection panel to connect your crypto wallet
2. **Interact with AI**: Use the chat interface to ask questions or perform operations
3. **Check System Status**: Expand the MCP Diagnosis panel to view system status
4. **Example Commands**:
   - "Connect my wallet with address 0x..."
   - "What can I do with this wallet?"
   - "Tell me about the current network"

## Development

### Project Structure

```
├── build/              # MCP server build output
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router files
│   │   ├── api/        # API routes
│   │   └── ...
│   ├── components/     # React components
│   │   ├── ui/         # Shadcn UI components
│   │   └── ...
│   ├── mcp/            # MCP server implementation
│   ├── services/       # Service modules
│   └── ...
└── ...
```

### Key Components

- **WalletConnect**: Handles wallet connection using Wagmi
- **ChatBox**: Provides the conversational interface
- **McpStatus**: Displays system diagnostics
- **MCP Services**: Handles communication with the MCP server

### Building for Production

1. Build the Next.js application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

## Troubleshooting

If you encounter issues with the MCP server:

1. Check the MCP Diagnosis panel for specific error messages
2. Ensure your Anthropic API key is valid and has sufficient credits
3. Try rebuilding the MCP server using the "Rebuild MCP Server" button
4. Check the console logs for more detailed error information

## License

[MIT](LICENSE)

## Acknowledgements

- [Anthropic Claude](https://www.anthropic.com/)
- [MCP](https://modelcontextprotocol.io/)
- [Wagmi](https://wagmi.sh/)

