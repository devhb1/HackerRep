// API route to fetch platform statistics (users, connections, votes, activities)
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    try {
        // 1. Get total users count
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        // 2. Get users with accepted connections
        const { count: usersWithConnections } = await supabase
            .from('connection_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')

        // 3. Get total votes cast today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { count: votesToday } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())

        // 4. Get total activities for feed
        const { count: totalActivities } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })

        // Return all stats for dashboard
        return NextResponse.json({
            totalUsers: totalUsers || 0,
            activeConnections: Math.floor((usersWithConnections || 0) / 2), // Each connection creates 2 records
            votesToday: votesToday || 0,
            totalActivities: totalActivities || 0
        })
    } catch (error) {
        // Log error for debugging
        console.error('Stats API error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}