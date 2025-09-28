import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import { generateAcademicZKPDFProof, generateGitHubZKPDFProof } from '@/lib/zkpdf-integration'

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

    try {
        // Use real zkPDF integration for GitHub proof generation
        const zkProof = await generateGitHubZKPDFProof(
            walletAddress,
            githubUsername,
            githubStats
        )

        // The zkPDF integration automatically stores the proof and updates base reputation
        // No need to manually store - it's handled by storeZKPDFProof function

        return NextResponse.json({
            success: true,
            message: `🐙 GitHub zkPDF proof generated! ${zkProof.reputationScore} points awarded to your base ZK reputation.`,
            proof: {
                proofId: zkProof.proofId,
                proofType: 'github',
                score: zkProof.reputationScore,
                commitment: Array.from(zkProof.circuitProof.messageDigestHash).map(b => b.toString(16).padStart(2, '0')).join(''),
                nullifier: Array.from(zkProof.circuitProof.nullifier).map(b => b.toString(16).padStart(2, '0')).join(''),
                verified: zkProof.verified
            },
            githubStats: {
                username: githubUsername,
                commits: githubStats.totalCommits,
                repos: githubStats.publicRepos,
                languages: githubStats.languages?.length || 0
            },
            baseReputation: {
                githubScore: zkProof.reputationScore,
                totalBaseScore: zkProof.reputationScore, // Will be updated by trigger
                reputationTier: zkProof.reputationScore >= 300 ? 'senior-dev' : 
                              zkProof.reputationScore >= 200 ? 'developer' : 
                              zkProof.reputationScore >= 100 ? 'student' : 'newcomer'
            }
        })

    } catch (error) {
        console.error('GitHub zkPDF proof generation failed:', error)
        return NextResponse.json(
            { error: `GitHub zkPDF proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        )
    }
}

// Generate Academic ZK Proof
async function generateAcademicProof(walletAddress: string, data: any) {
    const { degreeType, institution, pdfBuffer } = data

    if (!degreeType || !institution) {
        return NextResponse.json(
            { error: 'Missing degreeType or institution' },
            { status: 400 }
        )
    }

    try {
        // Convert PDF buffer to ArrayBuffer if provided
        let pdfArrayBuffer: ArrayBuffer | undefined
        if (pdfBuffer && pdfBuffer.data && Array.isArray(pdfBuffer.data)) {
            pdfArrayBuffer = new Uint8Array(pdfBuffer.data).buffer
        }

        // Use real zkPDF integration for academic proof generation
        const zkProof = await generateAcademicZKPDFProof(
            walletAddress,
            degreeType as 'highschool' | 'bachelors' | 'masters' | 'phd' | 'certification',
            institution,
            pdfArrayBuffer || new ArrayBuffer(0)
        )

        // The zkPDF integration automatically stores the proof and updates base reputation
        // No need to manually store - it's handled by storeZKPDFProof function

        return NextResponse.json({
            success: true,
            message: `🎓 Academic zkPDF proof generated! ${zkProof.reputationScore} points awarded to your base ZK reputation.`,
            proof: {
                proofId: zkProof.proofId,
                proofType: 'academic',
                score: zkProof.reputationScore,
                commitment: Array.from(zkProof.circuitProof.messageDigestHash).map(b => b.toString(16).padStart(2, '0')).join(''),
                nullifier: Array.from(zkProof.circuitProof.nullifier).map(b => b.toString(16).padStart(2, '0')).join(''),
                verified: zkProof.verified
            },
            academic: {
                degreeType,
                institution,
                score: zkProof.reputationScore
            },
            baseReputation: {
                educationScore: zkProof.reputationScore,
                totalBaseScore: zkProof.reputationScore, // Will be updated by trigger
                reputationTier: zkProof.reputationScore >= 300 ? 'senior-dev' : 
                              zkProof.reputationScore >= 200 ? 'developer' : 
                              zkProof.reputationScore >= 100 ? 'student' : 'newcomer',
                hasDegree: ['bachelors', 'masters', 'phd'].includes(degreeType),
                hasCertification: ['certification', 'highschool'].includes(degreeType)
            }
        })

    } catch (error) {
        console.error('Academic zkPDF proof generation failed:', error)
        return NextResponse.json(
            { error: `Academic zkPDF proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        )
    }
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
