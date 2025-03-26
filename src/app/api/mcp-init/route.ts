import { NextRequest, NextResponse } from 'next/server';
import { initMcpClient, getMcpClient } from '@/services/mcp-client';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';

export async function GET(request: NextRequest) {
  try {
    // 检查是否已初始化
    const existingClient = getMcpClient();
    if (existingClient && existingClient.getInitializationStatus()) {
      // 获取工具列表
      const tools = existingClient.getTools();
      
      return NextResponse.json({ 
        success: true, 
        initialized: true,
        tools 
      });
    }
    
    // 获取环境变量
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    // 验证API密钥是否有效
    try {
      const anthropic = new Anthropic({ apiKey });
      
      // 尝试一个简单的API调用来验证密钥
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

    // 初始化MCP客户端
    const mcpClient = initMcpClient(apiKey);
    
    // 确定server.js的路径
    let serverPath = 'build/server.js';
    if (process.env.NODE_ENV === 'production') {
      serverPath = path.join(process.cwd(), 'build/server.js');
    }

    // 确认服务器文件存在
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      return NextResponse.json(
        { success: false, error: `Server file not found: ${serverPath}` },
        { status: 500 }
      );
    }
    
    // 连接到服务器，添加重试机制
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= MAX_RETRIES) {
      if (retryCount > 0) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      try {
        await mcpClient.connectToServer(serverPath);
        
        // 验证是否真正初始化
        if (!mcpClient.getInitializationStatus()) {
          throw new Error("Initialization status check failed after connection");
        }
        
        // 检查工具数量
        const tools = mcpClient.getTools();
        if (!tools || tools.length === 0) {
          throw new Error("No available tools found");
        }
        
        // 如果到达这里，表示初始化成功
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
    
    // 所有重试都失败
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