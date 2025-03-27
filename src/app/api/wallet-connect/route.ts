import { NextRequest, NextResponse } from 'next/server';

// store pending wallet connection requests
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
    
    // store the connection request, the frontend will poll this request
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
  // return all pending wallet connection requests
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');
  
  if (requestId && requestId in pendingWalletRequests) {
    // if querying a specific request and it exists, return and remove
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