import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting HackerRep contract event listener...');
    
    // Dynamic import to avoid build-time execution
    const { contractPollingListener } = await import('@/lib/contract-polling-listener');
    
    // Start the polling listener
    await contractPollingListener.startPolling();
    
    return NextResponse.json({
      success: true,
      message: 'Contract event listener started successfully',
      contractAddress: '0xF54C11EbC39905dd88496E098CDEeC565F79a696', // VERIFIED CONTRACT
      network: 'Celo Mainnet'
    });

  } catch (error) {
    console.error('Error starting event listener:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start event listener',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🛑 Stopping HackerRep contract event listener...');
    
    // Dynamic import to avoid build-time execution
    const { contractPollingListener } = await import('@/lib/contract-polling-listener');
    
    // Stop the polling listener
    await contractPollingListener.stopPolling();
    
    return NextResponse.json({
      success: true,
      message: 'Contract event listener stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping event listener:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to stop event listener',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
