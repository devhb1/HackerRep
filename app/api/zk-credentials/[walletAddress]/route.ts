/**
 * ZK Credentials API
 * 
 * Manages Zero-Knowledge credentials for wallet addresses.
 * 
 * GET: Fetch or create ZK credentials record
 * PATCH: Update education, GitHub, or social scores
 * 
 * Features:
 * - Auto-creates default record if none exists
 * - Calculates reputation tiers automatically via database triggers
 * - Syncs with main users table for reputation updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/zk-credentials/[walletAddress]
export async function GET(
    request: NextRequest,
    { params }: { params: { walletAddress: string } }
) {
    try {
        const { walletAddress } = params

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        // Get or create ZK credentials directly by wallet address
        let { data: credentials, error: credentialsError } = await supabase
            .from('zk_credentials')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single()

        if (credentialsError && credentialsError.code === 'PGRST116') {
            // No ZK credentials exist, create default record
            const { data: newCredentials, error: createError } = await supabase
                .from('zk_credentials')
                .insert({
                    wallet_address: walletAddress.toLowerCase(),
                    education_score: 0,
                    github_score: 0,
                    social_score: 0,
                    total_base_score: 0,
                    reputation_tier: 'newcomer',
                    completed_onboarding: false,
                    has_degree: false,
                    has_certification: false,
                    github_username: null
                })
                .select()
                .single()

            if (createError) {
                console.error('Failed to create ZK credentials:', createError)
                return NextResponse.json(
                    { error: 'Failed to create credentials record' },
                    { status: 500 }
                )
            }

            credentials = newCredentials
        } else if (credentialsError) {
            console.error('Failed to fetch ZK credentials:', credentialsError)
            return NextResponse.json(
                { error: 'Failed to fetch credentials' },
                { status: 500 }
            )
        }

        return NextResponse.json({ credentials })
    } catch (error) {
        console.error('ZK credentials API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/zk-credentials/[walletAddress] - Update credentials
export async function PUT(
    request: NextRequest,
    { params }: { params: { walletAddress: string } }
) {
    try {
        const { walletAddress } = params
        const updates = await request.json()

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        // Update ZK credentials directly by wallet address
        const { data: updatedCredentials, error: updateError } = await supabase
            .from('zk_credentials')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('wallet_address', walletAddress.toLowerCase())
            .select()
            .single()

        if (updateError) {
            console.error('Failed to update ZK credentials:', updateError)
            return NextResponse.json(
                { error: 'Failed to update credentials' },
                { status: 500 }
            )
        }

        return NextResponse.json({ credentials: updatedCredentials })
    } catch (error) {
        console.error('ZK credentials update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}