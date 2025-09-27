import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Submit a new vote
export async function POST(request: Request) {
    try {
        const { voterWallet, votedForWallet, voteType, feedback } = await request.json()

        // Get user IDs
        const { data: voter } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', voterWallet)
            .single()

        const { data: votedFor } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', votedForWallet)
            .single()

        if (!voter || !votedFor) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if users are connected
        const { data: connection } = await supabase
            .from('connection_requests')
            .select('*')
            .or(`and(requester_id.eq.${voter.id},target_id.eq.${votedFor.id}),and(requester_id.eq.${votedFor.id},target_id.eq.${voter.id})`)
            .eq('status', 'accepted')
            .single()

        if (!connection) {
            return NextResponse.json({ error: 'Can only vote on connected users' }, { status: 400 })
        }

        // Check if already voted
        const { data: existingVote } = await supabase
            .from('votes')
            .select('*')
            .eq('voter_id', voter.id)
            .eq('voted_for_id', votedFor.id)
            .single()

        if (existingVote) {
            return NextResponse.json({ error: 'Already voted for this user' }, { status: 400 })
        }

        // Create vote
        const { error: voteError } = await supabase
            .from('votes')
            .insert({
                voter_id: voter.id,
                voted_for_id: votedFor.id,
                vote_type: voteType,
                feedback,
                connection_request_id: connection.id
            })

        if (voteError) throw voteError

        // Update reputation
        const repChange = voteType === 'upvote' ? 1 : -1
        const { error: repError } = await supabase
            .from('users')
            .update({
                reputation: votedFor.reputation + repChange,
                total_upvotes: voteType === 'upvote' ? votedFor.total_upvotes + 1 : votedFor.total_upvotes,
                total_downvotes: voteType === 'downvote' ? votedFor.total_downvotes + 1 : votedFor.total_downvotes
            })
            .eq('id', votedFor.id)

        if (repError) throw repError

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Vote submission error:', error)
        return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
    }
}

// Returns votes cast by the user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userWallet = searchParams.get('user')
    if (!userWallet) return NextResponse.json({ votes: [] })

    // Find user ID
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', userWallet)
        .single()
    if (!user) return NextResponse.json({ votes: [] })

    // Get votes cast by this user
    const { data: votes } = await supabase
        .from('votes')
        .select('vote_type, voted_for_id')
        .eq('voter_id', user.id)

    // Fetch voted-for user info
    const detailed = await Promise.all((votes || []).map(async (v: any) => {
        const { data: votedFor } = await supabase
            .from('users')
            .select('ens_name, display_name, wallet_address')
            .eq('id', v.voted_for_id)
            .single()
        return {
            vote_type: v.vote_type,
            voted_for_ens: votedFor?.ens_name,
            voted_for_display: votedFor?.display_name,
            voted_for_wallet: votedFor?.wallet_address
        }
    }))

    return NextResponse.json({ votes: detailed })
}
