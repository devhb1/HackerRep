import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, selfAppConfig } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Creating verification session for wallet:', walletAddress);

    // Dynamic import to avoid build-time execution
    const { sessionManager } = await import('@/lib/session-manager');

    // Check for existing active sessions
    const existingSessions = await sessionManager.getActiveSessionsForWallet(walletAddress);
    
    if (existingSessions.length > 0) {
      // Cancel existing sessions
      for (const session of existingSessions) {
        await sessionManager.cancelSession(session.sessionId);
      }
      console.log(`🔄 Cancelled ${existingSessions.length} existing sessions for wallet: ${walletAddress}`);
    }

    // Create new session
    const session = await sessionManager.createSession(walletAddress, selfAppConfig);

    console.log('✅ Created verification session:', session.sessionId);

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        walletAddress: session.walletAddress,
        status: session.status,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      },
      message: 'Verification session created successfully'
    });

  } catch (error) {
    console.error('Error creating verification session:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create verification session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          walletAddress: session.walletAddress,
          status: session.status,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      });
    }

    if (walletAddress) {
      // Get active sessions for wallet
      const sessions = await sessionManager.getActiveSessionsForWallet(walletAddress);
      
      return NextResponse.json({
        success: true,
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          walletAddress: session.walletAddress,
          status: session.status,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt
        }))
      });
    }

    // Get session statistics
    const stats = await sessionManager.getSessionStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting session data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get session data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}