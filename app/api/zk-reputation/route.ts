import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Complete ZK Reputation API - Works with full database setup
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, action, data } = body

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            )
        }

        console.log(`🎯 ZK Reputation Action: ${action} for ${walletAddress}`)

        switch (action) {
            case 'generate_github_proof':
                return await generateGitHubProof(walletAddress, data)
            
            case 'generate_academic_proof':
                return await generateAcademicProof(walletAddress, data)
            
            case 'get_reputation':
                return await getReputation(walletAddress)
            
            case 'get_leaderboard':
                return await getLeaderboard()
            
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('ZK Reputation API error:', error)
        return NextResponse.json({
            success: false,
            error: 'ZK Reputation operation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET endpoint for reputation data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')
        const action = searchParams.get('action') || 'get_reputation'

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress parameter' },
                { status: 400 }
            )
        }

        if (action === 'get_reputation') {
            return await getReputation(walletAddress)
        }

        return NextResponse.json({
            success: true,
            message: 'ZK Reputation API Ready',
            actions: ['generate_github_proof', 'generate_academic_proof', 'get_reputation', 'get_leaderboard']
        })

    } catch (error) {
        console.error('ZK Reputation GET error:', error)
        return NextResponse.json({
            error: 'Failed to retrieve reputation data'
        }, { status: 500 })
    }
}

// Generate GitHub ZK Proof
async function generateGitHubProof(walletAddress: string, data: any) {
    const { githubUsername, githubStats } = data

    if (!githubUsername || !githubStats) {
        return NextResponse.json(
            { error: 'Missing githubUsername or githubStats' },
            { status: 400 }
        )
    }

    // Calculate GitHub score
    let score = 25 // Base score
    
    if (githubStats.totalCommits >= 200) {
        score += 100
    } else if (githubStats.totalCommits >= 100) {
        score += 75
    } else if (githubStats.totalCommits >= 50) {
        score += 50
    } else if (githubStats.totalCommits >= 10) {
        score += 25
    }

    score += Math.min(githubStats.publicRepos * 2, 30)
    score += Math.min(githubStats.languages.length * 3, 20)
    score = Math.min(score, 200)

    // Generate ZK proof components
    const proofId = `github_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const randomness = crypto.randomBytes(16).toString('hex')
    
    const commitment = crypto.createHash('sha256')
        .update(`${githubUsername}_${githubStats.totalCommits}_${randomness}`)
        .digest('hex')
    
    const nullifier = crypto.createHash('sha256')
        .update(`${walletAddress}_github_${githubUsername}`)
        .digest('hex')

    // Store ZK proof
    const { error: proofError } = await supabase
        .from('zk_proofs')
        .insert({
            wallet_address: walletAddress.toLowerCase(),
            proof_type: 'github',
            proof_id: proofId,
            commitment,
            nullifier,
            score_awarded: score,
            proof_data: {
                githubUsername,
                githubStats,
                generatedAt: new Date().toISOString()
            }
        })

    if (proofError) {
        console.error('Failed to store ZK proof:', proofError)
        return NextResponse.json(
            { error: 'Failed to store ZK proof' },
            { status: 500 }
        )
    }

    // Update ZK credentials
    const { error: credError } = await supabase
        .from('zk_credentials')
        .upsert({
            wallet_address: walletAddress.toLowerCase(),
            github_score: score,
            github_username: githubUsername,
            github_data: githubStats,
            github_proofs: JSON.stringify([{
                proofId,
                score,
                commitment,
                nullifier,
                createdAt: new Date().toISOString()
            }]),
            completed_onboarding: true
        }, {
            onConflict: 'wallet_address'
        })

    if (credError) {
        console.error('Failed to update credentials:', credError)
        return NextResponse.json(
            { error: 'Failed to update credentials' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        message: `🐙 GitHub ZK proof generated! ${score} points awarded.`,
        proof: {
            proofId,
            proofType: 'github',
            score,
            commitment,
            nullifier,
            verified: true
        },
        githubStats: {
            username: githubUsername,
            commits: githubStats.totalCommits,
            repos: githubStats.publicRepos,
            languages: githubStats.languages?.length || 0
        }
    })
}

// Generate Academic ZK Proof
async function generateAcademicProof(walletAddress: string, data: any) {
    const { degreeType, institution } = data

    if (!degreeType || !institution) {
        return NextResponse.json(
            { error: 'Missing degreeType or institution' },
            { status: 400 }
        )
    }

    // Calculate academic score
    const scoreMap: Record<string, number> = {
        'highschool': 50,
        'bachelors': 100,
        'masters': 150,
        'phd': 200,
        'certification': 75
    }
    
    const score = scoreMap[degreeType] || 50

    // Generate ZK proof components
    const proofId = `academic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const randomness = crypto.randomBytes(16).toString('hex')
    
    const commitment = crypto.createHash('sha256')
        .update(`${institution}_${degreeType}_${randomness}`)
        .digest('hex')
    
    const nullifier = crypto.createHash('sha256')
        .update(`${walletAddress}_academic_${institution}`)
        .digest('hex')

    // Store ZK proof
    const { error: proofError } = await supabase
        .from('zk_proofs')
        .insert({
            wallet_address: walletAddress.toLowerCase(),
            proof_type: 'academic',
            proof_id: proofId,
            commitment,
            nullifier,
            score_awarded: score,
            proof_data: {
                degreeType,
                institution,
                generatedAt: new Date().toISOString()
            }
        })

    if (proofError) {
        console.error('Failed to store academic ZK proof:', proofError)
        return NextResponse.json(
            { error: 'Failed to store ZK proof' },
            { status: 500 }
        )
    }

    // Update ZK credentials
    const { error: credError } = await supabase
        .from('zk_credentials')
        .upsert({
            wallet_address: walletAddress.toLowerCase(),
            education_score: score,
            has_degree: ['bachelors', 'masters', 'phd'].includes(degreeType),
            has_certification: ['certification', 'highschool'].includes(degreeType),
            education_proofs: JSON.stringify([{
                proofId,
                degreeType,
                institution,
                score,
                commitment,
                nullifier,
                createdAt: new Date().toISOString()
            }]),
            completed_onboarding: true
        }, {
            onConflict: 'wallet_address'
        })

    if (credError) {
        console.error('Failed to update academic credentials:', credError)
        return NextResponse.json(
            { error: 'Failed to update credentials' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        message: `🎓 Academic ZK proof generated! ${score} points awarded.`,
        proof: {
            proofId,
            proofType: 'academic',
            score,
            commitment,
            nullifier,
            verified: true
        },
        academic: {
            degreeType,
            institution,
            score
        }
    })
}

// Get user reputation
async function getReputation(walletAddress: string) {
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

    const { data: zkCreds, error: zkError } = await supabase
        .from('zk_credentials')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

    const { data: zkProofs, error: proofsError } = await supabase
        .from('zk_proofs')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('verification_status', 'verified')

    return NextResponse.json({
        success: true,
        user: user || null,
        zkCredentials: zkCreds || null,
        zkProofs: zkProofs || [],
        reputation: {
            educationScore: zkCreds?.education_score || 0,
            githubScore: zkCreds?.github_score || 0,
            socialScore: zkCreds?.social_score || 0,
            totalScore: zkCreds?.total_base_score || 0,
            tier: zkCreds?.reputation_tier || 'newcomer',
            selfVerified: user?.self_verified || false,
            votingEligible: user?.voting_eligible || false
        }
    })
}

// Get leaderboard
async function getLeaderboard() {
    const { data: leaderboard, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .limit(50)

    if (error) {
        console.error('Leaderboard error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        leaderboard: leaderboard || [],
        count: leaderboard?.length || 0
    })
}
