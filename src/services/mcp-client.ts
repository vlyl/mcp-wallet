import { Anthropic } from '@anthropic-ai/sdk';
import {
  MessageParam,
  Tool,
} from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * MCPClient handles interaction between users, the MCP server, and Claude.
 * It connects to an MCP server, discovers available tools, and processes
 * user queries by orchestrating communication with Claude and executing tool calls.
 */
export class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private isInitialized = false;

  /**
   * Initialize the MCP client with Anthropic API
   * @param apiKey The Anthropic API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    
    // Initialize Anthropic client for LLM communication
    this.anthropic = new Anthropic({
      apiKey,
    });
    
    // Initialize MCP client with metadata
    this.mcp = new Client({ name: 'mcp-client-web', version: '1.0.0' });
  }

  /**
   * Connect to an MCP server and discover available tools
   * @param serverScriptPath Path to the MCP server script
   * @returns A promise that resolves when connected
   */
  async connectToServer(serverScriptPath: string): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Validate the server script type
      const isJs = serverScriptPath.endsWith('.js');
      const isPy = serverScriptPath.endsWith('.py');
      if (!isJs && !isPy) {
        const error = new Error('Server script must be a .js or .py file');
        throw error;
      }

      // Set the appropriate command based on script type and platform
      const command = isPy
        ? process.platform === 'win32'
          ? 'python'
          : 'python3'
        : process.execPath;
      
      // Try with absolute path if relative path doesn't exist
      let effectivePath = serverScriptPath;
      
      // If path doesn't start with /, try to resolve from root
      if (!effectivePath.startsWith('/') && process.env.NODE_ENV === 'production') {
        // In production, use absolute path from project root
        effectivePath = `${process.cwd()}/${serverScriptPath}`;
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(effectivePath)) {
        const error = new Error(`Server script file not found: ${effectivePath}`);
        throw error;
      }

      // Ensure file is executable
      try {
        if (process.platform !== 'win32') {
          // On Unix-like systems, make sure the file is executable
          const { execSync } = require('child_process');
          execSync(`chmod +x ${effectivePath}`);
        }
      } catch (err) {
        // Continue as this may not be fatal
      }

      // Create a transport layer to communicate with the server
      this.transport = new StdioClientTransport({
        command,
        args: [effectivePath],
      });
      
      // Connect with a timeout
      try {
        const connectPromise = this.mcp.connect(this.transport);
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        );
        
        await Promise.race([connectPromise, timeout]);
      } catch (err) {
        throw err;
      }

      // List available tools from the server
      try {
        const toolsResult = await this.mcp.listTools();
        this.tools = toolsResult.tools.map((tool) => {
          return {
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
          };
        });
      } catch (err) {
        throw err;
      }
      
      this.isInitialized = true;
      return true;
    } catch (e) {
      this.isInitialized = false;
      throw e;
    }
  }

  /**
   * Process a user query by sending it to Claude and handling any tool calls
   * @param query User's text query
   * @returns Final response text with tool results
   */
  async processQuery(query: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized. Call connectToServer first.');
    }
    
    // Initialize the conversation with the user's query
    const messages: MessageParam[] = [
      {
        role: 'user',
        content: query,
      },
    ];

    // Send the initial query to Claude with available tools
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    // Arrays to collect the response text and tool results
    const finalText: string[] = [];
    const toolResults: any[] = [];

    // Process each content item from Claude's response
    for (const content of response.content) {
      if (content.type === 'text') {
        // Handle text response
        finalText.push(content.text);
      } else if (content.type === 'tool_use') {
        // Handle tool use request from Claude
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        // Execute the tool call via MCP
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        
        toolResults.push(result);
        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        );

        // Add the tool result to the conversation
        messages.push({
          role: 'user',
          content: result.content as string,
        });

        // Get Claude's response to the tool result
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages,
        });

        // Add Claude's response to the final output
        finalText.push(
          response.content[0].type === 'text' ? response.content[0].text : ''
        );
      }
    }

    // Combine all text into a single response
    return finalText.join('\n');
  }

  /**
   * Clean up resources and close connections
   */
  async cleanup() {
    if (this.mcp) {
      await this.mcp.close();
      this.isInitialized = false;
    }
  }
  
  /**
   * Check if the client is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get available tools
   */
  getTools(): Tool[] {
    return this.tools;
  }
}

// Create and export a singleton instance for use throughout the application
let mcpClientInstance: MCPClient | null = null;

/**
 * Initialize the MCP client
 * @param apiKey The Anthropic API key
 * @returns The MCPClient instance
 */
export function initMcpClient(apiKey: string): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient(apiKey);
  }
  return mcpClientInstance;
}

/**
 * Get the existing MCP client instance
 * @returns The MCPClient instance or null if not initialized
 */
export function getMcpClient(): MCPClient | null {
  return mcpClientInstance;
}
