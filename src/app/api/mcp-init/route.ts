import { NextRequest, NextResponse } from 'next/server';
import { initMcpClient, getMcpClient } from '@/services/mcp-client';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';

export async function GET(request: NextRequest) {
  try {
    // check if initialized
    const existingClient = getMcpClient();
    if (existingClient && existingClient.getInitializationStatus()) {
      // get tools list
      const tools = existingClient.getTools();
      
      return NextResponse.json({ 
        success: true, 
        initialized: true,
        tools 
      });
    }
    
    // get environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    // validate API key
    try {
      const anthropic = new Anthropic({ apiKey });
      
      // try a simple API call to validate the key
      const models = await anthropic.models.list();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: `API key validation failed: ${error instanceof Error ? error.message : String(error)}` 
        },
        { status: 500 }
      );
    }

    // initialize MCP client
    const mcpClient = initMcpClient(apiKey);
    
    // determine the path to server.js
    let serverPath = 'build/server.js';
    if (process.env.NODE_ENV === 'production') {
      serverPath = path.join(process.cwd(), 'build/server.js');
    }

    // confirm the server file exists
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      return NextResponse.json(
        { success: false, error: `Server file not found: ${serverPath}` },
        { status: 500 }
      );
    }
    
    // connect to the server, add retry mechanism
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= MAX_RETRIES) {
      if (retryCount > 0) {
        // wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      try {
        await mcpClient.connectToServer(serverPath);
        
        // validate if it is really initialized
        if (!mcpClient.getInitializationStatus()) {
          throw new Error("Initialization status check failed after connection");
        }
        
        // check the number of tools
        const tools = mcpClient.getTools();
        if (!tools || tools.length === 0) {
          throw new Error("No available tools found");
        }
        
        // if we get here, initialization is successful
        return NextResponse.json({ 
          success: true, 
          initialized: true,
          tools 
        });
      } catch (error) {
        lastError = error;
        retryCount++;
      }
    }
    
    // all retries failed
    return NextResponse.json(
      { 
        success: false, 
        initialized: false,
        error: `Failed to connect to MCP server after ${MAX_RETRIES} retries: ${lastError instanceof Error ? lastError.message : String(lastError)}` 
      },
      { status: 500 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        initialized: false,
        error: error instanceof Error ? error.message : 'Failed to initialize MCP client' 
      },
      { status: 500 }
    );
  }
} 