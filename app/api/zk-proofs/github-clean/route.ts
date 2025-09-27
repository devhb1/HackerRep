import { NextRequest, NextResponse } from 'next/server'
import { generateGitHubZKProof, verifyZKProof, getTotalReputation } from '@/lib/zkpdf-reputation'

// POST /api/zk-proofs/github - Generate ZK proof for GitHub contributions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, githubUsername, githubStats } = body

        if (!walletAddress || !githubUsername || !githubStats) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, githubUsername, githubStats' },
                { status: 400 }
            )
        }

        // Validate GitHub stats structure
        const requiredStats = ['publicRepos', 'totalCommits', 'languages', 'accountCreated', 'followers']
        for (const field of requiredStats) {
            if (!(field in githubStats)) {
                return NextResponse.json(
                    { error: `Missing GitHub stat: ${field}` },
                    { status: 400 }
                )
            }
        }

        // Generate zkPDF proof for GitHub contributions
        console.log('🐙 Generating GitHub zkPDF proof...')
        const zkProof = await generateGitHubZKProof(
            walletAddress,
            githubUsername,
            githubStats
        )

        // Verify the generated proof
        const isValid = await verifyZKProof(zkProof)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Generated ZK proof is invalid' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `🐙 GitHub zkPDF proof generated! ${zkProof.score} reputation points earned.`,
            proof: {
                proofId: zkProof.proofId,
                proofType: zkProof.proofType,
                commitment: zkProof.commitment,
                nullifier: zkProof.nullifier,
                score: zkProof.score,
                verified: zkProof.verified,
                createdAt: zkProof.createdAt,
                expiresAt: zkProof.expiresAt
            },
            scoreAwarded: zkProof.score,
            githubStats: {
                username: githubUsername,
                commits: githubStats.totalCommits,
                repos: githubStats.publicRepos,
                languages: githubStats.languages.length
            }
        })

    } catch (error) {
        console.error('GitHub ZK proof generation error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate GitHub ZK proof',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// GET /api/zk-proofs/github - Get total reputation for wallet
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress parameter' },
                { status: 400 }
            )
        }

        // Get total reputation
        const reputation = await getTotalReputation(walletAddress)

        return NextResponse.json({
            success: true,
            walletAddress,
            reputation
        })

    } catch (error) {
        console.error('GitHub reputation retrieval error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve reputation' },
            { status: 500 }
        )
    }
}