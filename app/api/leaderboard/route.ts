import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns leaderboard sorted by zkPDF-verified reputation
// Only shows users who have generated zkPDF proofs
export async function GET() {
    try {
        // Query users who have completed zkPDF proof generation
        const { data: zkUsers, error } = await supabase
            .from('zk_credentials')
            .select(`
                wallet_address,
                education_score,
                github_score,
                social_score,
                total_base_score,
                reputation_tier,
                completed_onboarding,
                created_at,
                updated_at
            `)
            .eq('completed_onboarding', true)  // Only users with zkPDF proofs
            .gt('total_base_score', 0)         // Must have reputation points
            .order('total_base_score', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Leaderboard query error:', error)
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
        }

        // Format the leaderboard with zkPDF-specific data
        const leaderboard = (zkUsers || []).map((user, index) => ({
            rank: index + 1,
            wallet_address: user.wallet_address,
            display_name: user.wallet_address.substring(0, 6) + '...' + user.wallet_address.substring(38),
            // zkPDF Reputation Scores
            zkpdf_reputation: user.total_base_score,
            education_score: user.education_score,
            github_score: user.github_score,
            social_score: user.social_score,
            reputation_tier: user.reputation_tier,
            // Placeholder for Phase 2 voting system
            total_upvotes: 0,
            total_downvotes: 0,
            current_reputation: user.total_base_score, // Starting reputation = zkPDF reputation
            zkpdf_verified: true,
            created_at: user.created_at,
            updated_at: user.updated_at
        }))

        return NextResponse.json({
            leaderboard,
            message: 'zkPDF Verified Reputation Leaderboard',
            total_verified_users: leaderboard.length,
            hackathon_track: 'Ethereum Foundation - Best Applications on General Privacy'
        })

    } catch (error) {
        console.error('Leaderboard error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
