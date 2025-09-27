import { NextRequest, NextResponse } from 'next/server'
import { generateGitHubZKPDFProof, verifyZKPDFProof, getZKPDFReputation } from '@/lib/zkpdf-integration'

// POST /api/zk-proofs/github-clean - Generate OFFICIAL zkPDF-style proof for GitHub contributions
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

        // Generate zkPDF-style proof for GitHub contributions using official zkPDF concepts
        console.log('🐙 Generating GitHub zkPDF-style proof...')
        const zkpdfProof = await generateGitHubZKPDFProof(
            walletAddress,
            githubUsername,
            githubStats
        )

        // Verify the generated zkPDF proof
        const isValid = await verifyZKPDFProof(zkpdfProof)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Generated zkPDF proof is invalid' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `🐙 GitHub zkPDF-style proof generated! ${zkpdfProof.reputationScore} reputation points earned.`,
            zkpdfProof: {
                proofId: zkpdfProof.proofId,
                proofType: zkpdfProof.proofType,
                circuitProof: {
                    substringMatches: zkpdfProof.circuitProof.substringMatches,
                    signature_valid: zkpdfProof.circuitProof.signature_valid,
                    messageDigestHash: Array.from(zkpdfProof.circuitProof.messageDigestHash),
                    nullifier: Array.from(zkpdfProof.circuitProof.nullifier)
                },
                reputationScore: zkpdfProof.reputationScore,
                verified: zkpdfProof.verified,
                createdAt: zkpdfProof.createdAt,
                expiresAt: zkpdfProof.expiresAt
            },
            scoreAwarded: zkpdfProof.reputationScore,
            githubStats: {
                username: githubUsername,
                commits: githubStats.totalCommits,
                repos: githubStats.publicRepos,
                languages: githubStats.languages.length
            },
            hackathonTrack: "Ethereum Foundation - Best Applications on General Privacy",
            zkpdfCompliant: true
        })

    } catch (error) {
        console.error('GitHub zkPDF proof generation error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate GitHub zkPDF proof',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// GET /api/zk-proofs/github-clean - Get total zkPDF reputation for wallet
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

        // Get total zkPDF reputation
        const reputation = await getZKPDFReputation(walletAddress)

        return NextResponse.json({
            success: true,
            walletAddress,
            reputation,
            zkpdfCompliant: true,
            hackathonTrack: "Ethereum Foundation - Best Applications on General Privacy"
        })

    } catch (error) {
        console.error('zkPDF reputation retrieval error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve zkPDF reputation' },
            { status: 500 }
        )
    }
}