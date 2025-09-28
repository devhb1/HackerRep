import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking verification status for wallet:', walletAddress);

    // Get user verification status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Get verification record
    const { data: verification, error: verificationError } = await supabase
      .from('self_verifications')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('verification_status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('Error fetching verification:', verificationError);
    }

    // Get active sessions
    const { data: activeSessions, error: sessionError } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .in('status', ['pending', 'qr_generated', 'user_scanned', 'verifying'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
    }

    const response = {
      walletAddress: walletAddress.toLowerCase(),
      isVerified: user?.self_verified || false,
      verificationLevel: user?.verification_level || 0,
      votingEligible: user?.voting_eligible || false,
      demographics: {
        nationality: user?.nationality || null,
        gender: user?.gender || null,
        age: user?.age || null
      },
      verification: verification ? {
        nationality: verification.nationality,
        gender: verification.gender,
        age: verification.age,
        verifiedAt: verification.verified_at,
        txHash: verification.tx_hash
      } : null,
      activeSessions: activeSessions?.map(session => ({
        sessionId: session.session_id,
        status: session.status,
        createdAt: session.created_at,
        expiresAt: session.expires_at
      })) || [],
      lastUpdated: user?.updated_at || null
    };

    console.log('✅ Verification status retrieved:', {
      walletAddress: response.walletAddress,
      isVerified: response.isVerified,
      votingEligible: response.votingEligible,
      activeSessions: response.activeSessions.length
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check verification status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
