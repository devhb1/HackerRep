import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// GET /api/auth/github - Initiate GitHub OAuth
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
        // Redirect to GitHub OAuth
        const clientId = process.env.GITHUB_CLIENT_ID
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hacker-rep.vercel.app'
        // Ensure no double slashes in redirect URI
        const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/github`
        const scope = 'read:user user:email'
        const stateParam = crypto.randomBytes(32).toString('hex')

        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${stateParam}`

        return NextResponse.redirect(githubAuthUrl)
    }

    // Handle OAuth callback
    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.error) {
            throw new Error(tokenData.error_description)
        }

        // Get GitHub user data
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        })

        const githubUser = await userResponse.json()

        // Get GitHub stats
        const statsData = await getGitHubStats(githubUser.login, tokenData.access_token)

        // Generate ZK proof for GitHub data
        const zkProofHash = generateGitHubZKProof(githubUser, statsData)

        // Calculate score based on GitHub activity
        const githubScore = calculateGitHubScore(statsData)

        // For now, redirect back to homepage with success message
        // In production, you'd want to properly handle the wallet address state
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hacker-rep.vercel.app'
        const successUrl = `${baseUrl.replace(/\/$/, '')}/?github_connected=true&score=${githubScore}&username=${githubUser.login}`

        return NextResponse.redirect(successUrl)

    } catch (error) {
        console.error('GitHub OAuth error:', error)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hacker-rep.vercel.app'
        const errorUrl = `${baseUrl.replace(/\/$/, '')}/?github_error=true`
        return NextResponse.redirect(errorUrl)
    }
}

// POST /api/auth/github - Update user with GitHub data
export async function POST(request: NextRequest) {
    try {
        const { walletAddress, githubUsername, githubScore, accessToken } = await request.json()

        if (!walletAddress || !githubUsername) {
            return NextResponse.json(
                { error: 'Wallet address and GitHub username are required' },
                { status: 400 }
            )
        }

        // Get fresh GitHub stats
        const githubStats = await getGitHubStats(githubUsername, accessToken)
        const calculatedScore = calculateGitHubScore(githubStats)
        const zkProofHash = generateGitHubZKProof({ login: githubUsername }, githubStats)

        // Update ZK credentials
        const { data: updatedCredentials, error: updateError } = await supabase
            .from('zk_credentials')
            .upsert({
                wallet_address: walletAddress.toLowerCase(),
                github_score: calculatedScore,
                github_username: githubUsername,
                github_data: JSON.stringify({
                    totalCommits: githubStats.totalCommits,
                    publicRepos: githubStats.publicRepos,
                    languages: githubStats.languages,
                    connectedAt: new Date().toISOString()
                }),
                github_proofs: JSON.stringify([{
                    hash: zkProofHash,
                    username: githubUsername,
                    timestamp: new Date().toISOString()
                }])
            })
            .select()
            .single()

        if (updateError) {
            console.error('Failed to update GitHub credentials:', updateError)
            return NextResponse.json(
                { error: 'Failed to update credentials' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            githubScore: calculatedScore,
            credentials: updatedCredentials,
            message: `GitHub connected successfully! You earned ${calculatedScore} reputation points.`
        })

    } catch (error) {
        console.error('GitHub connection error:', error)
        return NextResponse.json(
            { error: 'Failed to connect GitHub account' },
            { status: 500 }
        )
    }
}

async function getGitHubStats(username: string, accessToken?: string): Promise<{
    publicRepos: number
    totalCommits: number
    languages: string[]
    createdAt: string
}> {
    try {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
        }

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`
        }

        // Get user profile
        const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers })
        const userData = await userResponse.json()

        // Get repositories
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers })
        const repos = await reposResponse.json()

        // Calculate total commits (approximation)
        let totalCommits = 0
        const languages = new Set<string>()

        for (const repo of repos.slice(0, 10)) { // Limit to first 10 repos to avoid rate limits
            if (repo.owner.login === username) {
                // Get commits for this repo
                try {
                    const commitsResponse = await fetch(`${repo.commits_url.replace('{/sha}', '')}?author=${username}&per_page=1`, { headers })
                    const commitsLinkHeader = commitsResponse.headers.get('link')

                    if (commitsLinkHeader) {
                        const lastPageMatch = commitsLinkHeader.match(/page=(\d+)>; rel="last"/)
                        if (lastPageMatch) {
                            totalCommits += parseInt(lastPageMatch[1])
                        }
                    } else {
                        const commits = await commitsResponse.json()
                        totalCommits += Array.isArray(commits) ? commits.length : 0
                    }

                    if (repo.language) {
                        languages.add(repo.language)
                    }
                } catch (error) {
                    console.error(`Failed to get commits for ${repo.name}:`, error)
                }
            }
        }

        return {
            publicRepos: userData.public_repos || 0,
            totalCommits,
            languages: Array.from(languages),
            createdAt: userData.created_at
        }
    } catch (error) {
        console.error('Failed to get GitHub stats:', error)
        return {
            publicRepos: 0,
            totalCommits: 0,
            languages: [],
            createdAt: new Date().toISOString()
        }
    }
}

function calculateGitHubScore(stats: {
    publicRepos: number
    totalCommits: number
    languages: string[]
}): number {
    let score = 0

    // Base score for having a GitHub account
    score += 25

    // Commits scoring (max 100 points)
    if (stats.totalCommits >= 200) {
        score += 100
    } else if (stats.totalCommits >= 100) {
        score += 75
    } else if (stats.totalCommits >= 50) {
        score += 50
    } else if (stats.totalCommits >= 10) {
        score += 25
    }

    // Repository scoring (max 50 points)
    if (stats.publicRepos >= 20) {
        score += 50
    } else if (stats.publicRepos >= 10) {
        score += 30
    } else if (stats.publicRepos >= 5) {
        score += 20
    } else if (stats.publicRepos >= 1) {
        score += 10
    }

    // Language diversity bonus (max 25 points)
    const languageBonus = Math.min(stats.languages.length * 5, 25)
    score += languageBonus

    // Cap at 200 points max
    return Math.min(score, 200)
}

function generateGitHubZKProof(githubUser: any, stats: any): string {
    const timestamp = Date.now()
    const proofData = `github:${githubUser.login}:${stats.totalCommits}:${stats.publicRepos}:${timestamp}`
    return crypto.createHash('sha256').update(proofData).digest('hex')
}