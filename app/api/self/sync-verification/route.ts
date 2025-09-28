import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        // Update user with Self Protocol verification data
        const { data: user, error: userError } = await supabase
            .from('users')
            .update({
                self_verified: true,
                nationality: demographics?.nationality || 'INDIA',
                gender: demographics?.gender || 'MALE',
                age: demographics?.age || 25,
                updated_at: new Date().toISOString()
            })
            .eq('wallet_address', walletAddress.toLowerCase())
            .select()
            .single();

        if (userError) {
            console.error('Error updating user:', userError);
            return NextResponse.json({ 
                error: 'Failed to update user verification status' 
            }, { status: 500 });
        }

        // Store verification session
        const { data: session, error: sessionError } = await supabase
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