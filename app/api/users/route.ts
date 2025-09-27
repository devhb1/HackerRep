/**
 * Users API - Base route
 * 
 * Provides basic user data access and listing functionality
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // Use fixed pagination for static generation
        const limit = 50
        const offset = 0

        // Get users with basic info, ordered by reputation
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id,
                wallet_address,
                ens_name,
                display_name,
                avatar_url,
                reputation,
                total_upvotes,
                total_downvotes,
                total_connections,
                created_at
            `)
            .order('reputation', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Users API error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            )
        }

        // Get total count for pagination
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            users: users || [],
            total: count || 0,
            limit,
            offset,
            hasMore: (offset + limit) < (count || 0)
        })

    } catch (error) {
        console.error('Users API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}