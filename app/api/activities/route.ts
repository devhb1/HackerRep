// API route for activities: fetch and create activity feed items
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    // Parse query params for pagination and user filter
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const userWallet = searchParams.get('user')

    try {
        let activities, error
        if (userWallet) {
            // Find user ID
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('wallet_address', userWallet)
                .single()
            if (!user) return NextResponse.json({ activities: [] })
            // Fetch recent activities for this user
            const res = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit)
            activities = res.data
            error = res.error
        } else {
            // Fetch recent activities with user info (ENS, display, avatar, wallet)
            const res = await supabase
                .from('activities')
                .select(`
                    *,
                    user:users!activities_user_id_fkey(ens_name, display_name, avatar_url, wallet_address)
                `)
                .order('created_at', { ascending: false })
                .limit(limit)
            activities = res.data
            error = res.error
        }

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