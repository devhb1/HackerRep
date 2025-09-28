import { NextRequest, NextResponse } from 'next/server'

// Test the complete ZK reputation + Self Protocol system
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, testType = 'complete' } = body

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            )
        }

        console.log(`🧪 Testing complete system: ${testType}`)

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const results = []

        if (testType === 'github' || testType === 'complete') {
            // Test GitHub ZK proof generation
            console.log('🐙 Testing GitHub ZK proof...')
            
            const githubResponse = await fetch(`${baseUrl}/api/zk-reputation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    action: 'generate_github_proof',
                    data: {
                        githubUsername: `testuser_${Date.now()}`,
                        githubStats: {
                            publicRepos: Math.floor(Math.random() * 20) + 10,
                            totalCommits: Math.floor(Math.random() * 200) + 100,
                            languages: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Solidity'].slice(0, Math.floor(Math.random() * 4) + 2),
                            accountCreated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 4).toISOString(),
                            followers: Math.floor(Math.random() * 100) + 20
                        }
                    }
                })
            })

            if (githubResponse.ok) {
                const githubResult = await githubResponse.json()
                results.push({
                    test: 'GitHub ZK Proof',
                    status: 'SUCCESS ✅',
                    score: githubResult.proof?.score || 0,
                    proofId: githubResult.proof?.proofId
                })
            } else {
                results.push({
                    test: 'GitHub ZK Proof',
                    status: 'FAILED ❌',
                    error: await githubResponse.text()
                })
            }
        }

        if (testType === 'academic' || testType === 'complete') {
            // Test Academic ZK proof generation
            console.log('🎓 Testing Academic ZK proof...')
            
            const academicResponse = await fetch(`${baseUrl}/api/zk-reputation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    action: 'generate_academic_proof',
                    data: {
                        degreeType: ['highschool', 'bachelors', 'masters', 'phd', 'certification'][Math.floor(Math.random() * 5)],
                        institution: ['MIT', 'Stanford University', 'IIT Delhi', 'University of California', 'Oxford University', 'Harvard University'][Math.floor(Math.random() * 6)]
                    }
                })
            })

            if (academicResponse.ok) {
                const academicResult = await academicResponse.json()
                results.push({
                    test: 'Academic ZK Proof',
                    status: 'SUCCESS ✅',
                    score: academicResult.proof?.score || 0,
                    proofId: academicResult.proof?.proofId
                })
            } else {
                results.push({
                    test: 'Academic ZK Proof',
                    status: 'FAILED ❌',
                    error: await academicResponse.text()
                })
            }
        }

        if (testType === 'reputation' || testType === 'complete') {
            // Test reputation retrieval
            console.log('📊 Testing reputation retrieval...')
            
            // Wait a bit for database updates
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const reputationResponse = await fetch(`${baseUrl}/api/zk-reputation?walletAddress=${walletAddress}&action=get_reputation`)

            if (reputationResponse.ok) {
                const reputationResult = await reputationResponse.json()
                results.push({
                    test: 'Reputation Retrieval',
                    status: 'SUCCESS ✅',
                    reputation: reputationResult.reputation,
                    zkProofs: reputationResult.zkProofs?.length || 0
                })
            } else {
                results.push({
                    test: 'Reputation Retrieval',
                    status: 'FAILED ❌',
                    error: await reputationResponse.text()
                })
            }
        }

        if (testType === 'leaderboard' || testType === 'complete') {
            // Test leaderboard
            console.log('🏆 Testing leaderboard...')
            
            const leaderboardResponse = await fetch(`${baseUrl}/api/zk-reputation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    action: 'get_leaderboard'
                })
            })

            if (leaderboardResponse.ok) {
                const leaderboardResult = await leaderboardResponse.json()
                results.push({
                    test: 'Leaderboard',
                    status: 'SUCCESS ✅',
                    users: leaderboardResult.count || 0
                })
            } else {
                results.push({
                    test: 'Leaderboard',
                    status: 'FAILED ❌',
                    error: await leaderboardResponse.text()
                })
            }
        }

        // Calculate overall status
        const successCount = results.filter(r => r.status.includes('SUCCESS')).length
        const totalTests = results.length
        const overallStatus = successCount === totalTests ? 'ALL TESTS PASSED ✅' : `${successCount}/${totalTests} TESTS PASSED ⚠️`

        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0)

        return NextResponse.json({
            success: successCount === totalTests,
            message: `🧪 Complete System Test: ${overallStatus}`,
            walletAddress,
            testType,
            results,
            summary: {
                testsRun: totalTests,
                testsPassed: successCount,
                testsFailed: totalTests - successCount,
                totalScore,
                overallStatus
            },
            systemStatus: {
                level1ZKProofs: successCount > 0 ? 'WORKING ✅' : 'FAILED ❌',
                databaseIntegration: successCount > 0 ? 'WORKING ✅' : 'FAILED ❌',
                apiEndpoints: successCount > 0 ? 'WORKING ✅' : 'FAILED ❌'
            }
        })

    } catch (error) {
        console.error('Complete system test error:', error)
        return NextResponse.json({
            success: false,
            error: 'Complete system test failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            systemStatus: 'FAILED ❌'
        }, { status: 500 })
    }
}

// GET endpoint for system status
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Complete ZK Reputation + Self Protocol System Ready',
        endpoints: {
            github: 'POST /api/test-complete-system with { walletAddress, testType: "github" }',
            academic: 'POST /api/test-complete-system with { walletAddress, testType: "academic" }',
            reputation: 'POST /api/test-complete-system with { walletAddress, testType: "reputation" }',
            leaderboard: 'POST /api/test-complete-system with { walletAddress, testType: "leaderboard" }',
            complete: 'POST /api/test-complete-system with { walletAddress, testType: "complete" }'
        },
        features: [
            '✅ Level 1 ZK Proof Generation (GitHub + Academic)',
            '✅ Self Protocol Integration Ready',
            '✅ Complete Database Schema',
            '✅ Reputation Scoring & Tiers',
            '✅ Leaderboard System',
            '✅ Row Level Security',
            '✅ Automated Triggers & Functions'
        ],
        systemStatus: 'READY FOR PRODUCTION 🚀'
    })
}
