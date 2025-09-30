import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const { walletAddress } = await request.json();

        if (!walletAddress) {
            return NextResponse.json({
                error: 'Wallet address is required'
            }, { status: 400 });
        }

        console.log('🔧 Manual sync for wallet:', walletAddress);

        // Get current user record
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            return NextResponse.json({
                error: 'User not found'
            }, { status: 404 });
        }

        // Check if user has verified Self Protocol data but incorrect voting eligibility
        if (user.nationality === 'INDIA' && user.self_verified && !user.voting_eligible) {
            console.log('🎯 Found user needing voting eligibility fix');

            // Fix the user record
            const { data: updatedUser, error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    verification_level: 3, // Level 3 = Self Protocol verified
                    voting_eligible: true, // Indian users can vote
                    updated_at: new Date().toISOString()
                })
                .eq('wallet_address', walletAddress.toLowerCase())
                .select()
                .single();

            if (updateError) {
                console.error('Error updating user:', updateError);
                return NextResponse.json({
                    error: 'Failed to update user voting eligibility'
                }, { status: 500 });
            }

            console.log('✅ Fixed voting eligibility for user:', walletAddress);

            return NextResponse.json({
                success: true,
                message: 'Voting eligibility fixed',
                data: {
                    walletAddress: updatedUser.wallet_address,
                    verification_level: updatedUser.verification_level,
                    voting_eligible: updatedUser.voting_eligible,
                    nationality: updatedUser.nationality
                }
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'No fix needed - user already has correct voting eligibility',
                data: {
                    walletAddress: user.wallet_address,
                    verification_level: user.verification_level,
                    voting_eligible: user.voting_eligible,
                    nationality: user.nationality
                }
            });
        }

    } catch (error) {
        console.error('Error in manual sync:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}