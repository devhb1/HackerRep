import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Level 3 Leaderboard: Self Protocol verified users with voting-based reputation
export async function GET() {
    try {
        // Get Self Protocol verified users with Level 3 voting reputation
        const { data: level3Users, error } = await supabase
            .from('users')
            .select(`
                wallet_address,
                display_name,
                ens_name,
                avatar_url,
                reputation_score,
                age,
                gender,
                nationality,
                self_verified,
                created_at,
                updated_at
            `)
            .eq('self_verified', true)  // Only Self Protocol verified users
            .eq('nationality', 'INDIA')  // Only Indian users (voting eligible)
            .order('reputation_score', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Level 3 Leaderboard query error:', error)
            return NextResponse.json({ error: 'Failed to fetch Level 3 leaderboard' }, { status: 500 })
        }

        // Get voting statistics for each user
        const walletAddresses = (level3Users || []).map((user: any) => user.wallet_address)

        // Get votes received by each user
        const { data: votesReceived } = await supabase
            .from('votes')
            .select('voted_for_id, vote_type, verification_weight')
            .in('voted_for_id', (level3Users || []).map((user: any) => user.id))

        // Get user IDs mapping
        const { data: userIds } = await supabase
            .from('users')
            .select('id, wallet_address')
            .in('wallet_address', walletAddresses)

        const userIdMap = new Map(
            (userIds || []).map((user: any) => [user.wallet_address, user.id])
        )

        // Calculate voting statistics
        const votingStats = new Map()

        for (const user of level3Users || []) {
            const userId = userIdMap.get(user.wallet_address)
            const userVotes = (votesReceived || []).filter((vote: any) => vote.voted_for_id === userId)

            const upvotes = userVotes.filter((vote: any) => vote.vote_type === 'upvote')
            const downvotes = userVotes.filter((vote: any) => vote.vote_type === 'downvote')

            const totalUpvoteWeight = upvotes.reduce((sum: number, vote: any) => sum + (vote.verification_weight || 10), 0)
            const totalDownvoteWeight = downvotes.reduce((sum: number, vote: any) => sum + (vote.verification_weight || 10), 0)

            votingStats.set(user.wallet_address, {
                total_upvotes: upvotes.length,
                total_downvotes: downvotes.length,
                upvote_weight: totalUpvoteWeight,
                downvote_weight: totalDownvoteWeight,
                net_voting_impact: totalUpvoteWeight - totalDownvoteWeight
            })
        }

        // Format the Level 3 leaderboard
        const leaderboard = (level3Users || []).map((user: any, index: number) => {
            const stats = votingStats.get(user.wallet_address) || {
                total_upvotes: 0,
                total_downvotes: 0,
                upvote_weight: 0,
                downvote_weight: 0,
                net_voting_impact: 0
            }

            // Prioritize ENS name, fallback to display name, then wallet address
            const finalDisplayName = user.ens_name || user.display_name ||
                (user.wallet_address.substring(0, 6) + '...' + user.wallet_address.substring(38))

            return {
                rank: index + 1,
                wallet_address: user.wallet_address,
                display_name: finalDisplayName,
                ens_name: user.ens_name,
                avatar_url: user.avatar_url,

                // Level 3 Reputation System
                reputation_score: user.reputation_score || 100, // Current reputation
                base_reputation: 100, // Starting reputation
                reputation_change: (user.reputation_score || 100) - 100,

                // Demographic Data (Self Protocol verified)
                age: user.age,
                gender: user.gender,
                nationality: user.nationality,

                // Voting Statistics
                total_upvotes: stats.total_upvotes,
                total_downvotes: stats.total_downvotes,
                upvote_weight: stats.upvote_weight,
                downvote_weight: stats.downvote_weight,
                net_voting_impact: stats.net_voting_impact,

                // Level 3 Status
                self_verified: user.self_verified,
                voting_eligible: user.nationality === 'INDIA',
                level: 'Level 3: Self Protocol Verified + Voting Enabled',

                created_at: user.created_at,
                updated_at: user.updated_at
            }
        })

        return NextResponse.json({
            leaderboard,
            message: 'Level 3: Self Protocol Verified Users with Voting-Based Reputation',
            total_level3_users: leaderboard.length,
            voting_system: {
                base_power: 10,
                age_advantage: 15,
                age_disadvantage: 7,
                cross_gender_multiplier: 2,
                max_possible_power: 30
            }
        })

    } catch (error) {
        console.error('Level 3 Leaderboard error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
