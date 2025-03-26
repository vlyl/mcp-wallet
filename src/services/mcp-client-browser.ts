/**
 * Browser-compatible MCP client, communicates with the server via API calls
 */

/**
 * Tool definition interface
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

/**
 * MCP state interface
 */
export interface McpState {
  isInitialized: boolean;
  error: string | null;
  tools: ToolDefinition[];
}

// Global state
let mcpState: McpState = {
  isInitialized: false,
  error: null,
  tools: []
};

/**
 * Initialize MCP client
 * @returns Whether initialization was successful
 */
export async function initMcpClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/mcp-init');
    const data = await response.json();
    
    if (!data.success) {
      mcpState.error = data.error;
      mcpState.isInitialized = false;
      return false;
    }
    
    // Only set as initialized if the server side is actually initialized
    mcpState.isInitialized = data.initialized === true;
    mcpState.tools = data.tools || [];
    mcpState.error = null;
    
    return mcpState.isInitialized;
  } catch (error) {
    mcpState.error = error instanceof Error ? error.message : 'Unknown error';
    mcpState.isInitialized = false;
    return false;
  }
}

/**
 * Process user query
 * @param query User query text
 * @returns Processing result
 */
export async function processQuery(query: string): Promise<string> {
  try {
    if (!mcpState.isInitialized) {
      throw new Error('MCP client is not initialized');
    }
    
    // First verify server-side status
    try {
      const statusCheck = await fetch('/api/mcp-diagnosis');
      const statusData = await statusCheck.json();
      
      if (!statusData.mcpClient.initialized) {
        // Update local state
        mcpState.isInitialized = false;
        mcpState.error = "Server MCP not initialized, local state out of sync";
        throw new Error('Server MCP client is not initialized');
      }
    } catch (error) {
      // If the diagnostic API fails, continue with the query but log a warning
    }
    
    const response = await fetch('/api/mcp-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // If server reports MCP is not initialized, update local state
      if (data.error?.includes('not initialized')) {
        mcpState.isInitialized = false;
      }
      throw new Error(data.error || 'Failed to process query');
    }
    
    return data.result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get MCP client initialization status
 * @returns Whether it is initialized
 */
export function getInitializationStatus(): boolean {
  return mcpState.isInitialized;
}

/**
 * Get available tools list
 * @returns Tool list
 */
export function getAvailableTools(): ToolDefinition[] {
  return mcpState.tools;
}

/**
 * Get error message
 * @returns Error message
 */
export function getError(): string | null {
  return mcpState.error;
} 