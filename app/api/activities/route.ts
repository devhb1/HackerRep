// API route for activities: fetch and create activity feed items
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    // Parse query params for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    try {
        // Fetch recent activities with user info (ENS, display, avatar, wallet)
        const { data: activities, error } = await supabase
            .from('activities')
            .select(`
            *,
            user:users!activities_user_id_fkey(ens_name, display_name, avatar_url, wallet_address)
        `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Return activities for feed
        return NextResponse.json({ activities })
    } catch (error) {
        // Log error for debugging
        console.error('Activities fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        // Parse activity details from request body
        const { userId, activityType, description, targetUserId } = await request.json()

        // Insert new activity into feed
        const { data: activity, error } = await supabase
            .from('activities')
            .insert({
                user_id: userId,
                activity_type: activityType,
                description,
                target_user_id: targetUserId
            })
            .select()
            .single()

        if (error) throw error

        // Return created activity
        return NextResponse.json({ activity })
    } catch (error) {
        // Log error for debugging
        console.error('Activity creation error:', error)
        return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }
}