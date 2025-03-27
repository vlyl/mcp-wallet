import { NextRequest, NextResponse } from 'next/server';
import { initMcpClient, getMcpClient } from '@/services/mcp-client';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Get MCP client
    let mcpClient = getMcpClient();
    
    // Initialize if not initialized
    if (!mcpClient || !mcpClient.getInitializationStatus()) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'ANTHROPIC_API_KEY is not set' },
          { status: 500 }
        );
      }
      
      if (!mcpClient) {
        mcpClient = initMcpClient(apiKey);
      }
      
      // Try to connect to server
      if (!mcpClient.getInitializationStatus()) {
        try {
          // Determine server.js path
          let serverPath = 'build/server.js';
          if (process.env.NODE_ENV === 'production') {
            serverPath = path.join(process.cwd(), 'build/server.js');
          }
          
          // Check if file exists
          const fs = require('fs');
          if (!fs.existsSync(serverPath)) {
            return NextResponse.json(
              { success: false, error: `Server file not found: ${serverPath}` },
              { status: 500 }
            );
          }
          
          // Try to connect
          await mcpClient.connectToServer(serverPath);
        } catch (error) {
          return NextResponse.json(
            { success: false, error: `Failed to connect to server: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
          );
        }
      }
    }
    
    // Verify initialization status again
    if (!mcpClient.getInitializationStatus()) {
      return NextResponse.json(
        { success: false, error: 'MCP client is not initialized' },
        { status: 500 }
      );
    }
    
    // Process query
    try {
      const response = await mcpClient.processQuery(query);
      
      return NextResponse.json({ 
        success: true, 
        result: response 
      });
    } catch (error: unknown) {
      // If error is due to uninitialized MCP client, mark client as uninitialized
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('not initialized')) {
        if (mcpClient) {
          // Clean up client
          await mcpClient.cleanup();
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing query' 
      },
      { status: 500 }
    );
  }
} 