import { NextRequest, NextResponse } from 'next/server';
import { getMcpClient } from '@/services/mcp-client';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET(request: NextRequest) {
  console.log("[API-DIAGNOSIS] Starting MCP diagnosis");
  
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiKey: {
      exists: false,
      valid: false,
      error: null
    },
    serverFile: {
      exists: false,
      executable: false,
      path: null,
      error: null
    },
    mcpClient: {
      initialized: false,
      error: null
    }
  };
  
  // 1. Check API key
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    results.apiKey.exists = Boolean(apiKey);
    
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        // Try a simple API call to validate the key
        const models = await anthropic.models.list();
        results.apiKey.valid = true;
        results.apiKey.models = models.data.map(m => m.id);
      } catch (error) {
        results.apiKey.valid = false;
        results.apiKey.error = error instanceof Error ? error.message : String(error);
      }
    }
  } catch (error) {
    results.apiKey.error = error instanceof Error ? error.message : String(error);
  }
  
  // 2. Check MCP server file
  try {
    // Determine server.js path
    let serverPath = 'build/server.js';
    if (process.env.NODE_ENV === 'production') {
      serverPath = path.join(process.cwd(), 'build/server.js');
    }
    
    results.serverFile.path = serverPath;
    
    // Check if file exists
    results.serverFile.exists = fs.existsSync(serverPath);
    
    if (results.serverFile.exists) {
      // Check if file is executable (UNIX systems only)
      if (process.platform !== 'win32') {
        try {
          const { stdout, stderr } = await execPromise(`ls -l ${serverPath}`);
          results.serverFile.permissions = stdout.trim();
          
          // Add executable permission if needed
          if (!stdout.includes('x')) {
            await execPromise(`chmod +x ${serverPath}`);
            results.serverFile.executable = true;
            results.serverFile.permissionsFixed = true;
          } else {
            results.serverFile.executable = true;
          }
        } catch (error) {
          results.serverFile.executable = false;
          results.serverFile.error = error instanceof Error ? error.message : String(error);
        }
      } else {
        // Windows platform, assume executable
        results.serverFile.executable = true;
        results.serverFile.platform = 'windows';
      }
      
      // Check file content
      try {
        const content = fs.readFileSync(serverPath, 'utf8');
        results.serverFile.size = content.length;
        results.serverFile.contentSample = content.substring(0, 200) + '...';
        
        // Check if it includes connect-wallet tool
        results.serverFile.hasConnectWallet = content.includes('connect-wallet');
      } catch (error) {
        results.serverFile.error = `Failed to read file: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  } catch (error) {
    results.serverFile.error = error instanceof Error ? error.message : String(error);
  }
  
  // 3. Check MCP client status
  try {
    const mcpClient = getMcpClient();
    results.mcpClient.initialized = mcpClient ? mcpClient.getInitializationStatus() : false;
    
    if (mcpClient) {
      results.mcpClient.toolsAvailable = mcpClient.getTools().length > 0;
      results.mcpClient.tools = mcpClient.getTools().map(t => ({ 
        name: t.name,
        description: t.description
      }));
    }
  } catch (error) {
    results.mcpClient.error = error instanceof Error ? error.message : String(error);
  }
  
  // Return diagnosis results
  return NextResponse.json(results);
} 