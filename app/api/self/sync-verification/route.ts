import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, source, timestamp, contractAddress, chainId, demographics } = await request.json();

        if (!walletAddress) {
            return NextResponse.json({ 
                error: 'Wallet address is required' 
            }, { status: 400 });
        }

        // Check if user already exists in HackerRep
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error checking existing user:', userError);
            return NextResponse.json({ 
                error: 'Database error' 
            }, { status: 500 });
        }

        // Create user if doesn't exist
        if (!existingUser) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    display_name: `User ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`,
                    reputation_score: 100, // Base reputation for new users
                    self_verified: true,
                    verification_level: 2,
                    voting_eligible: demographics?.nationality === 'INDIA',
                    nationality: demographics?.nationality,
                    gender: demographics?.gender,
                    age: demographics?.age
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return NextResponse.json({ 
                    error: 'Failed to create user' 
                }, { status: 500 });
            }

            console.log('✅ Created new user with Self verification data:', newUser.id);
        } else {
            // Update existing user with Self verification fields
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    nationality: demographics?.nationality,
                    gender: demographics?.gender,
                    age: demographics?.age,
                    self_verified: true,
                    verification_level: 2,
                    voting_eligible: demographics?.nationality === 'INDIA',
                    updated_at: new Date().toISOString()
                })
                .eq('wallet_address', walletAddress.toLowerCase());

            if (updateError) {
                console.error('Error updating user:', updateError);
                return NextResponse.json({ 
                    error: 'Failed to update user' 
                }, { status: 500 });
            }

            console.log('✅ Updated user with Self verification data:', {
                nationality: demographics?.nationality,
                gender: demographics?.gender,
                age: demographics?.age
            });
        }

        // Create activity entry
        const userId = existingUser?.id || (await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single()).data?.id;

        if (userId) {
            await supabase
                .from('activities')
                .insert({
                    user_id: userId,
                    activity_type: 'self_verification',
                    description: `Identity verified with Self Protocol from ${source}`
                });
        }

        return NextResponse.json({ 
            success: true,
            message: 'Verification synced successfully',
            walletAddress: walletAddress.toLowerCase(),
            verified: true
        });

    } catch (error) {
        console.error('Sync verification error:', error);
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
