import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Level 3: Advanced Voting Power Calculation System
function calculateVotingPower(
    voterAge: number,
    voterReputation: number,
    voterGender: string,
    votedForAge: number,
    votedForReputation: number,
    votedForGender: string
): { power: number, breakdown: string } {
    let basePower = 10 // Base voting power
    let breakdown = `Base: ${basePower}`

    // Rule 1: Age difference > 5 years
    const ageDiff = Math.abs(voterAge - votedForAge)
    if (ageDiff > 5) {
        if (voterAge > votedForAge) {
            basePower = 15 // Higher age gets 15 points
            breakdown = `Age advantage (${voterAge} > ${votedForAge}): 15`
        } else {
            basePower = 7 // Lower age gets 7 points
            breakdown = `Age disadvantage (${voterAge} < ${votedForAge}): 7`
        }
    }

    // Rule 2: Reputation difference > 50 points (overrides age if both apply)
    const repDiff = Math.abs(voterReputation - votedForReputation)
    if (repDiff > 50) {
        if (voterReputation > votedForReputation) {
            basePower = 15 // Higher reputation gets 15 points
            breakdown = `Reputation advantage (${voterReputation} > ${votedForReputation}): 15`
        } else {
            basePower = 7 // Lower reputation gets 7 points
            breakdown = `Reputation disadvantage (${voterReputation} < ${votedForReputation}): 7`
        }
    }

    // Rule 3: Cross-gender voting bonus (2x multiplier)
    let finalPower = basePower
    if (voterGender && votedForGender &&
        voterGender !== votedForGender &&
        (voterGender === 'MALE' || voterGender === 'FEMALE') &&
        (votedForGender === 'MALE' || votedForGender === 'FEMALE')) {
        finalPower = basePower * 2
        breakdown += ` → Cross-gender bonus (${voterGender}→${votedForGender}): ${finalPower}`
    }

    return { power: finalPower, breakdown }
}

// Submit a new vote
export async function POST(request: Request) {
    try {
        const { voterWallet, votedForWallet, voteType, feedback } = await request.json()

        // Get comprehensive user data for voting power calculation
        const { data: voter } = await supabase
            .from('users')
            .select('id, reputation_score, age, gender, nationality, self_verified')
            .eq('wallet_address', voterWallet.toLowerCase())
            .single()

        const { data: votedFor } = await supabase
            .from('users')
            .select('id, reputation_score, age, gender, nationality, wallet_address, display_name')
            .eq('wallet_address', votedForWallet.toLowerCase())
            .single()

        if (!voter || !votedFor) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // LEVEL 3: Enhanced eligibility check - ONLY Self verified Indian users can vote
        const canVote = voter?.self_verified === true &&
            voter?.nationality === 'INDIA' &&
            voter?.voting_eligible === true

        if (!canVote) {
            let errorMessage = 'Voting not allowed. ';

            if (!voter?.self_verified) {
                errorMessage += 'Please complete Self Protocol verification first.';
            } else if (voter?.nationality !== 'INDIA') {
                errorMessage += 'Only users with Indian nationality can vote.';
            } else if (!voter?.voting_eligible) {
                errorMessage += 'Your voting eligibility is pending. Please wait a few moments and try again.';
            }

            return NextResponse.json({
                error: errorMessage,
                requirements: {
                    selfVerified: voter?.self_verified || false,
                    nationality: voter?.nationality || null,
                    votingEligible: voter?.voting_eligible || false
                },
                nextSteps: !voter?.self_verified ? 'Visit /self-verify to complete verification' : 'Wait for verification to be processed'
            }, { status: 400 })
        }

        // Use default values for missing demographic data
        const voterAge = voter.age || 25
        const voterGender = voter.gender || 'MALE'
        const votedForAge = votedFor.age || 25
        const votedForGender = votedFor.gender || 'MALE'

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

        // LEVEL 3: Calculate sophisticated voting power
        const votingPowerResult = calculateVotingPower(
            voterAge,
            voter.reputation_score || 0,
            voterGender,
            votedForAge,
            votedFor.reputation_score || 0,
            votedForGender
        )

        const votePower = votingPowerResult.power
        const repChange = (voteType === 'upvote' ? 1 : -1) * votePower

        // Demographic data already loaded in voter object

        // Create vote with basic data (matching table schema)
        const { error: voteError } = await supabase
            .from('votes')
            .insert({
                voter_id: voter.id,
                voted_for_id: votedFor.id,
                vote_type: voteType,
                feedback
            })

        if (voteError) throw voteError

        // Update reputation with Level 3 sophisticated scoring
        const newReputation = (votedFor.reputation_score || 0) + repChange
        const { error: repError } = await supabase
            .from('users')
            .update({
                reputation_score: Math.max(0, newReputation), // Prevent negative reputation
                updated_at: new Date().toISOString()
            })
            .eq('id', votedFor.id)

        if (repError) throw repError

        return NextResponse.json({
            success: true,
            votePower,
            repChange,
            powerBreakdown: votingPowerResult.breakdown,
            voterAge: voterAge,
            voterGender: voterGender,
            voterReputation: voter.reputation_score,
            votedForAge: votedForAge,
            votedForGender: votedForGender,
            votedForReputation: votedFor.reputation_score,
            newReputation: Math.max(0, (votedFor.reputation_score || 0) + repChange)
        })
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
