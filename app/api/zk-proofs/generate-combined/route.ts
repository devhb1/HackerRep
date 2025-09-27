import { NextRequest, NextResponse } from 'next/server'
import { generateAcademicZKPDFProof, generateGitHubZKPDFProof, verifyZKPDFProof } from '@/lib/zkpdf-integration'

// POST /api/zk-proofs/generate-combined - Generate zkPDF proofs for existing user credentials
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, proofTypes } = body

        if (!walletAddress || !proofTypes || !Array.isArray(proofTypes)) {
            return NextResponse.json(
                { error: 'Missing required fields: walletAddress, proofTypes (array)' },
                { status: 400 }
            )
        }

        console.log(`🏆 ETHEREUM FOUNDATION: Generating zkPDF proofs for: ${proofTypes.join(', ')}`)

        const results = []
        let totalPoints = 0

        // Handle GitHub zkPDF proof generation
        if (proofTypes.includes('github')) {
            try {
                console.log('🐙 Generating GitHub zkPDF proof...')
                
                // This would need to get GitHub data from the database or re-authenticate
                // For now, we'll simulate with stored data
                const githubResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://hacker-rep.vercel.app'}/api/zk-proofs/github-clean`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: walletAddress,
                        // GitHub data would need to be retrieved from stored credentials
                        regenerate: true
                    })
                })

                if (githubResponse.ok) {
                    const githubResult = await githubResponse.json()
                    if (githubResult.success) {
                        results.push({
                            type: 'github',
                            success: true,
                            score: githubResult.scoreAwarded,
                            proofId: githubResult.zkpdfProof.proofId
                        })
                        totalPoints += githubResult.scoreAwarded
                    }
                } else {
                    results.push({
                        type: 'github',
                        success: false,
                        error: 'Failed to generate GitHub zkPDF proof'
                    })
                }
            } catch (error) {
                console.error('GitHub zkPDF generation failed:', error)
                results.push({
                    type: 'github',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        // Handle Academic zkPDF proof generation
        if (proofTypes.includes('academic')) {
            results.push({
                type: 'academic',
                success: false,
                error: 'Academic zkPDF proof requires PDF re-upload. Please use the academic credentials section.'
            })
        }

        return NextResponse.json({
            success: results.some(r => r.success),
            message: `zkPDF proof generation completed`,
            results,
            totalPointsAwarded: totalPoints,
            proofTypesProcessed: proofTypes,
            hackathonTrack: "Ethereum Foundation - Best Applications on General Privacy",
            zkpdfCompliant: true
        })

    } catch (error) {
        console.error('Combined zkPDF proof generation error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate zkPDF proofs',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// GET /api/zk-proofs/generate-combined - Get user's current proof status
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

        // This would query the database to see what proofs the user has
        // and what they can generate
        return NextResponse.json({
            success: true,
            walletAddress,
            availableProofTypes: ['github'], // Academic requires re-upload
            message: 'Ready to generate zkPDF proofs for existing credentials'
        })

    } catch (error) {
        console.error('Proof status retrieval error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve proof status' },
            { status: 500 }
        )
    }
}