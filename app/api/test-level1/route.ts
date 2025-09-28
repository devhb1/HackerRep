import { NextRequest, NextResponse } from 'next/server'
import { 
    generateSimpleGitHubZKProof, 
    generateSimpleAcademicZKProof,
    testLevel1ZKGeneration,
    getSimpleReputation
} from '@/lib/simple-zk-reputation'

// POST /api/test-level1 - Quick test for Level 1 ZK proof generation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, testType } = body

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            )
        }

        console.log(`🧪 Testing Level 1 ZK proof generation: ${testType}`)

        if (testType === 'github') {
            // Test GitHub ZK proof generation
            const mockGitHubStats = {
                publicRepos: 10,
                totalCommits: 50,
                languages: ['TypeScript', 'JavaScript', 'Python']
            }

            const zkProof = await generateSimpleGitHubZKProof(
                walletAddress,
                'testuser',
                mockGitHubStats
            )

            return NextResponse.json({
                success: true,
                message: '🐙 GitHub ZK proof generated successfully!',
                proof: {
                    proofId: zkProof.proofId,
                    score: zkProof.score,
                    commitment: zkProof.commitment,
                    nullifier: zkProof.nullifier,
                    verified: zkProof.verified
                },
                level1Working: true
            })
        }

        if (testType === 'academic') {
            // Test Academic ZK proof generation
            const zkProof = await generateSimpleAcademicZKProof(
                walletAddress,
                'bachelors',
                'Test University'
            )

            return NextResponse.json({
                success: true,
                message: '🎓 Academic ZK proof generated successfully!',
                proof: {
                    proofId: zkProof.proofId,
                    score: zkProof.score,
                    commitment: zkProof.commitment,
                    nullifier: zkProof.nullifier,
                    verified: zkProof.verified
                },
                level1Working: true
            })
        }

        // Test both using the comprehensive test function
        const testResult = await testLevel1ZKGeneration(walletAddress)

        if (!testResult.success) {
            return NextResponse.json({
                success: false,
                error: testResult.message,
                level1Status: 'FAILED'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: testResult.message,
            proofs: {
                github: {
                    proofId: testResult.githubProof?.proofId,
                    score: testResult.githubProof?.score,
                    verified: testResult.githubProof?.verified
                },
                academic: {
                    proofId: testResult.academicProof?.proofId,
                    score: testResult.academicProof?.score,
                    verified: testResult.academicProof?.verified
                }
            },
            totalScore: testResult.totalScore,
            level1Status: 'WORKING',
            zkReputationEnabled: true
        })

    } catch (error) {
        console.error('Level 1 test error:', error)
        return NextResponse.json({
            success: false,
            error: 'Level 1 ZK proof generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            level1Status: 'FAILED'
        }, { status: 500 })
    }
}

// GET /api/test-level1 - Check Level 1 status
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Level 1 ZK Reputation System Ready',
        endpoints: {
            github: 'POST /api/test-level1 with { walletAddress, testType: "github" }',
            academic: 'POST /api/test-level1 with { walletAddress, testType: "academic" }',
            both: 'POST /api/test-level1 with { walletAddress }'
        },
        level1Status: 'READY'
    })
}
