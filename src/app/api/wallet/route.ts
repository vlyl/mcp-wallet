import { NextRequest, NextResponse } from 'next/server';
import { connectWallet, disconnectWallet, getWalletState } from '@/mcp/server';

// 获取钱包状态
export async function GET() {
  try {
    const walletState = getWalletState();
    return NextResponse.json({
      success: true,
      ...walletState
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// 连接钱包（从前端设置地址）
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

    const result = await connectWallet(address);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// 断开钱包连接
export async function DELETE() {
  try {
    const result = await disconnectWallet();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 