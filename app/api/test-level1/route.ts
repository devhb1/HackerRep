import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
            // Test GitHub ZK proof generation using main API with realistic data
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/zk-reputation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    action: 'generate_github_proof',
                    data: {
                        githubUsername: `testuser_${Date.now()}`,
                        githubStats: {
                            publicRepos: Math.floor(Math.random() * 20) + 5,
                            totalCommits: Math.floor(Math.random() * 200) + 50,
                            languages: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'].slice(0, Math.floor(Math.random() * 3) + 2),
                            accountCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString(),
                            followers: Math.floor(Math.random() * 100) + 10
                        }
                    }
                })
            })

            if (!response.ok) {
                throw new Error('GitHub ZK proof generation failed')
            }

            const result = await response.json()

            return NextResponse.json({
                success: true,
                message: '🐙 GitHub ZK proof generated successfully!',
                proof: result.proof,
                level1Working: true
            })
        }

        if (testType === 'academic') {
            // Test Academic ZK proof generation using main API with realistic data
            const degreeTypes = ['highschool', 'bachelors', 'masters', 'phd', 'certification']
            const institutions = ['MIT', 'Stanford University', 'IIT Delhi', 'University of California', 'Oxford University', 'Harvard University']
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/zk-reputation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    action: 'generate_academic_proof',
                    data: {
                        degreeType: degreeTypes[Math.floor(Math.random() * degreeTypes.length)],
                        institution: institutions[Math.floor(Math.random() * institutions.length)]
                    }
                })
            })

            if (!response.ok) {
                throw new Error('Academic ZK proof generation failed')
            }

            const result = await response.json()

            return NextResponse.json({
                success: true,
                message: '🎓 Academic ZK proof generated successfully!',
                proof: result.proof,
                level1Working: true
            })
        }

        // Test both GitHub and Academic ZK proof generation with realistic data
        const githubResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/zk-reputation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress,
                action: 'generate_github_proof',
                data: {
                    githubUsername: `testuser_${Date.now()}`,
                    githubStats: {
                        publicRepos: Math.floor(Math.random() * 20) + 5,
                        totalCommits: Math.floor(Math.random() * 200) + 50,
                        languages: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'].slice(0, Math.floor(Math.random() * 3) + 2),
                        accountCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString(),
                        followers: Math.floor(Math.random() * 100) + 10
                    }
                }
            })
        })

        const degreeTypes = ['highschool', 'bachelors', 'masters', 'phd', 'certification']
        const institutions = ['MIT', 'Stanford University', 'IIT Delhi', 'University of California', 'Oxford University', 'Harvard University']
        
        const academicResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/zk-reputation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress,
                action: 'generate_academic_proof',
                data: {
                    degreeType: degreeTypes[Math.floor(Math.random() * degreeTypes.length)],
                    institution: institutions[Math.floor(Math.random() * institutions.length)]
                }
            })
        })

        if (!githubResponse.ok || !academicResponse.ok) {
            return NextResponse.json({
                success: false,
                error: 'Failed to generate ZK proofs',
                level1Status: 'FAILED'
            }, { status: 500 })
        }

        const githubResult = await githubResponse.json()
        const academicResult = await academicResponse.json()

        return NextResponse.json({
            success: true,
            message: '🎉 Both GitHub and Academic ZK proofs generated successfully!',
            proofs: {
                github: {
                    proofId: githubResult.proof?.proofId,
                    score: githubResult.proof?.score,
                    verified: githubResult.proof?.verified
                },
                academic: {
                    proofId: academicResult.proof?.proofId,
                    score: academicResult.proof?.score,
                    verified: academicResult.proof?.verified
                }
            },
            totalScore: (githubResult.proof?.score || 0) + (academicResult.proof?.score || 0),
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
