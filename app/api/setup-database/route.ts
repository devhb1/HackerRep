// API route to setup all database tables using Supabase RPC
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        // 1. Create users table
        const { error: usersError } = await supabase.rpc('create_users_table', {})

        // 2. Create connection_requests table
        const { error: connectionsError } = await supabase.rpc('create_connection_requests_table', {})

        // 3. Create votes table
        const { error: votesError } = await supabase.rpc('create_votes_table', {})

        // 4. Create activities table for real-time feed
        const { error: activitiesError } = await supabase.rpc('create_activities_table', {})

        // Return setup status and any errors
        return NextResponse.json({
            success: true,
            message: 'Database setup complete',
            errors: {
                users: usersError?.message || null,
                connections: connectionsError?.message || null,
                votes: votesError?.message || null,
                activities: activitiesError?.message || null
            }
        })
    } catch (error) {
        // Log error for debugging
        console.error('Database setup error:', error)
        return NextResponse.json({ error: 'Database setup failed' }, { status: 500 })
    }
}