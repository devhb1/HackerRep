import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for backend operations to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            walletAddress,
            source,
            timestamp,
            contractAddress,
            chainId,
            demographics
        } = body;

        if (!walletAddress) {
            return NextResponse.json({
                error: 'Missing wallet address'
            }, { status: 400 });
        }

        console.log('🔄 Syncing Self Protocol verification for:', walletAddress);

        // Check if user exists, create if not, update if exists
        const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, wallet_address')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        let user, userError;

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing user:', fetchError);
        }

        if (!existingUser) {
            // Create new user
            const { data, error } = await supabaseAdmin
                .from('users')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    display_name: `User ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
                    self_verified: true,
                    nationality: demographics?.nationality || 'INDIA',
                    gender: demographics?.gender || 'MALE',
                    age: demographics?.age || 25,
                    voting_eligible: (demographics?.nationality || 'INDIA') === 'INDIA',
                    reputation_score: 100,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            user = data;
            userError = error;
        } else {
            // Update existing user
            const { data, error } = await supabaseAdmin
                .from('users')
                .update({
                    self_verified: true,
                    nationality: demographics?.nationality || 'INDIA',
                    gender: demographics?.gender || 'MALE',
                    age: demographics?.age || 25,
                    voting_eligible: (demographics?.nationality || 'INDIA') === 'INDIA',
                    updated_at: new Date().toISOString()
                })
                .eq('wallet_address', walletAddress.toLowerCase())
                .select()
                .single();
            user = data;
            userError = error;
        }

        if (userError) {
            console.error('Error managing user:', userError);
            return NextResponse.json({
                error: 'Failed to update user verification status'
            }, { status: 500 });
        }

        // Store verification session
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('verification_sessions')
            .insert({
                wallet_address: walletAddress.toLowerCase(),
                verification_type: 'self_protocol',
                status: 'verified',
                verification_data: {
                    source,
                    timestamp,
                    contractAddress,
                    chainId,
                    demographics
                },
                completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Error storing verification session:', sessionError);
            // Don't fail the request if session storage fails
        }

        console.log('✅ Self Protocol verification synced successfully');

        return NextResponse.json({
            success: true,
            message: 'Self Protocol verification synced successfully',
            user: {
                wallet_address: user.wallet_address,
                self_verified: user.self_verified,
                nationality: user.nationality,
                gender: user.gender,
                age: user.age
            },
            verification: {
                type: 'self_protocol',
                status: 'verified',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Self Protocol sync error:', error);
        return NextResponse.json({
            error: 'Failed to sync Self Protocol verification',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}