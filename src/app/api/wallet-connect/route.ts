import { NextRequest, NextResponse } from 'next/server';

// 全局变量存储钱包连接的请求
let pendingWalletRequests: Record<string, boolean> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }
    
    // 存储连接请求，前端将轮询此请求
    const requestId = Date.now().toString();
    pendingWalletRequests[requestId] = true;
    
    return NextResponse.json({
      success: true,
      requestId,
      address,
      message: `Requesting to connect wallet: ${address}`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing wallet connect request' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 返回所有待处理的钱包连接请求
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');
  
  if (requestId && requestId in pendingWalletRequests) {
    // 如果查询特定请求且存在，则返回并移除
    const exists = pendingWalletRequests[requestId];
    delete pendingWalletRequests[requestId];
    
    return NextResponse.json({
      success: true,
      exists,
      pendingRequests: Object.keys(pendingWalletRequests).length
    });
  }
  
  return NextResponse.json({
    success: true,
    pendingRequests: Object.keys(pendingWalletRequests),
    count: Object.keys(pendingWalletRequests).length
  });
} 