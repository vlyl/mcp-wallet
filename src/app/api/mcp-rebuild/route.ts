import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export async function POST(request: NextRequest) {
  console.log("[API-REBUILD] Starting to rebuild MCP server");
  
  const results: Record<string, any> = {
    success: false,
    buildOutput: null,
    error: null,
    serverExists: false
  };
  
  try {
    // Execute build command
    console.log("[API-REBUILD] Executing build command: pnpm build:mcp-server");
    const { stdout, stderr } = await execPromise('pnpm build:mcp-server', { 
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });
    
    results.buildOutput = stdout;
    if (stderr) {
      results.buildError = stderr;
    }
    
    // Check if server file exists
    const serverPath = path.join(process.cwd(), 'build/server.js');
    results.serverExists = fs.existsSync(serverPath);
    
    if (results.serverExists) {
      // For UNIX systems, ensure the file is executable
      if (process.platform !== 'win32') {
        await execPromise(`chmod +x ${serverPath}`);
      }
      
      results.success = true;
      results.serverPath = serverPath;
      console.log("[API-REBUILD] Rebuild successful, server file located at:", serverPath);
    } else {
      results.success = false;
      results.error = "Build completed but server.js file not found";
      console.error("[API-REBUILD] Build completed but server file not found");
    }
  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : String(error);
    console.error("[API-REBUILD] Build failed:", error);
  }
  
  return NextResponse.json(results);
} 