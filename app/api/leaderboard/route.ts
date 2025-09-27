import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns leaderboard sorted by ZK proof-verified reputation
export async function GET() {
    try {
        // Query users with ZK proof-verified reputation scores
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
                github_username,
                has_degree,
                has_certification,
                created_at,
                updated_at
            `)
            .gt('total_base_score', 0)  // Anyone with reputation points
            .order('total_base_score', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Leaderboard query error:', error)
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
        }

        // Get user profile data for ENS names and display names
        const walletAddresses = (zkUsers || []).map(user => user.wallet_address)
        const { data: userProfiles } = await supabase
            .from('users')
            .select('wallet_address, ens_name, display_name, avatar_url, seniority_index')
            .in('wallet_address', walletAddresses)

        // Create a map for quick lookup
        const userProfileMap = new Map(
            (userProfiles || []).map(profile => [profile.wallet_address, profile])
        )

        // Format the leaderboard with zkPDF-specific data and ENS integration
        const leaderboard = (zkUsers || []).map((user, index) => {
            const userProfile = userProfileMap.get(user.wallet_address)
            // Prioritize ENS name, fallback to display name, then wallet address
            const ensName = userProfile?.ens_name
            const displayName = userProfile?.display_name
            const finalDisplayName = ensName || displayName ||
                (user.wallet_address.substring(0, 6) + '...' + user.wallet_address.substring(38))

            return {
                rank: index + 1,
                wallet_address: user.wallet_address,
                display_name: finalDisplayName,
                ens_name: ensName,
                avatar_url: userProfile?.avatar_url,
                seniority_index: userProfile?.seniority_index || 1,
                // zkPDF Reputation Scores
                zkpdf_reputation: user.total_base_score,
                education_score: user.education_score,
                github_score: user.github_score,
                social_score: user.social_score,
                reputation_tier: user.reputation_tier,
                github_username: user.github_username,
                // Placeholder for Phase 2 voting system
                total_upvotes: 0,
                total_downvotes: 0,
                current_reputation: user.total_base_score, // Starting reputation = zkPDF reputation
                zkpdf_verified: user.completed_onboarding || user.total_base_score > 0,
                level: user.total_base_score >= 50 ? 'Level 1: ZK Verified' : 'Level 0: Newcomer',
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        })



        return NextResponse.json({
            leaderboard,
            message: 'ZK Proof Verified Reputation Leaderboard',
            total_verified_users: leaderboard.length
        })

    } catch (error) {
        console.error('Leaderboard error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
