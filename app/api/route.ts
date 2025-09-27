/**
 * API Index - Lists available endpoints
 * 
 * Simple endpoint to verify API routes are working
 */

import { NextResponse } from 'next/server'

export async function GET() {
    const apiEndpoints = {
        status: 'API is working',
        timestamp: new Date().toISOString(),
        endpoints: {
            users: '/api/users - List all users',
            stats: '/api/stats - Platform statistics',
            debug: '/api/debug/database - Database health check',
            zkCredentials: '/api/zk-credentials/[wallet] - ZK credentials by wallet',
            userRegister: '/api/users/register - Register new user',
            userSearch: '/api/users/search - Search users',
            connections: '/api/connections - Connection requests',
            votes: '/api/votes - Voting system',
            activities: '/api/activities - User activities'
        },
        note: 'This is a HackerRep API endpoint for testing'
    }

    return NextResponse.json(apiEndpoints)
}