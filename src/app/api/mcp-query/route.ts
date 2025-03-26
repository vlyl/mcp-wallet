import { NextRequest, NextResponse } from 'next/server';
import { initMcpClient, getMcpClient } from '@/services/mcp-client';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // 获取MCP客户端
    let mcpClient = getMcpClient();
    
    // 如果没有初始化则尝试初始化
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
      
      // 尝试连接到服务器
      if (!mcpClient.getInitializationStatus()) {
        try {
          // 确定server.js的路径
          let serverPath = 'build/server.js';
          if (process.env.NODE_ENV === 'production') {
            serverPath = path.join(process.cwd(), 'build/server.js');
          }
          
          // 检查文件是否存在
          const fs = require('fs');
          if (!fs.existsSync(serverPath)) {
            return NextResponse.json(
              { success: false, error: `Server file not found: ${serverPath}` },
              { status: 500 }
            );
          }
          
          // 尝试连接
          await mcpClient.connectToServer(serverPath);
        } catch (error) {
          return NextResponse.json(
            { success: false, error: `Failed to connect to server: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
          );
        }
      }
    }
    
    // 再次确认初始化状态
    if (!mcpClient.getInitializationStatus()) {
      return NextResponse.json(
        { success: false, error: 'MCP client is not initialized' },
        { status: 500 }
      );
    }
    
    // 处理查询
    try {
      const response = await mcpClient.processQuery(query);
      
      return NextResponse.json({ 
        success: true, 
        result: response 
      });
    } catch (error: unknown) {
      // 如果是由于MCP客户端未初始化导致的错误，标记客户端为未初始化
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('not initialized')) {
        if (mcpClient) {
          // 清理客户端
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