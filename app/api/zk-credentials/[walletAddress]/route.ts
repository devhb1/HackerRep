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
                    // total_base_score is a generated column - don't insert it
                    // reputation_tier is a generated column - don't insert it
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

// POST /api/zk-credentials/[walletAddress] - Update credentials (including final reputation generation)
export async function POST(
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

        // If this is a final reputation generation, also update the main users table
        if (updates.completed_onboarding && updates.total_base_score) {
            try {
                const { error: userUpdateError } = await supabase
                    .from('users')
                    .update({
                        reputation: updates.total_base_score,
                        updated_at: new Date().toISOString()
                    })
                    .eq('wallet_address', walletAddress.toLowerCase())

                if (userUpdateError) {
                    console.error('Failed to update main user reputation:', userUpdateError)
                    // Don't fail the request, just log the error
                }
            } catch (error) {
                console.error('Error updating main user table:', error)
            }
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