import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic import to avoid build-time execution
        const { contractPollingListener } = await import('@/lib/contract-polling-listener');

        const isRunning = contractPollingListener.isListenerRunning();
        const lastProcessedBlock = contractPollingListener.getLastProcessedBlock();

        return NextResponse.json({
            success: true,
            status: {
                isRunning,
                lastProcessedBlock,
                contractAddress: '0xF54C11EbC39905dd88496E098CDEeC565F79a696',
                network: 'Celo Mainnet'
            },
            message: isRunning ? 'Contract listener is running' : 'Contract listener is not running'
        });

    } catch (error) {
        console.error('Error checking listener status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check listener status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}