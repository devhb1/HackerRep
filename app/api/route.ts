/**
 * API Index - Lists available endpoints
 * 
 * Simple endpoint to verify API routes are working
 */

import { NextResponse } from 'next/server'

export async function GET() {
    const apiEndpoints = {
        status: 'ZK Reputation API is operational',
        timestamp: new Date().toISOString(),
        system: 'Privacy-First Reputation Protocol',
        endpoints: {
            // Core ZK System
            zkCredentials: '/api/zk-credentials/[wallet] - ZK credentials management',
            zkProofsAcademic: '/api/zk-proofs/academic - Academic zkPDF proof generation',
            zkProofsGithub: '/api/zk-proofs/github-clean - GitHub zkPDF proof generation',

            // User Management
            users: '/api/users - User profiles',
            userRegister: '/api/users/register - Register new user',
            userSearch: '/api/users/search - Search users',

            // Social Layer
            connections: '/api/connections - Connection system',
            votes: '/api/votes - Peer voting system',
            activities: '/api/activities - Activity feed',

            // Platform
            stats: '/api/stats - Platform statistics',
            leaderboard: '/api/leaderboard - ZK verified reputation rankings',

            // Authentication
            auth: '/api/auth/github - GitHub OAuth integration'
        },
        features: [
            '🔒 zkPDF Zero-Knowledge Proofs',
            '🎓 Academic Credential Verification',
            '⚡ GitHub Skill Verification',
            '🗳️ Peer Reputation Voting',
            '🏆 Privacy-Preserving Leaderboards'
        ]
    }

    return NextResponse.json(apiEndpoints)
}