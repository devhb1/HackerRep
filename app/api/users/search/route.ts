// API route to search users by ENS name, display name, or wallet address
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    // Parse search query from URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        // No query provided, return empty result
        return NextResponse.json({ users: [] })
    }

    try {
        // Search users by ENS, display name, or wallet address
        const { data: users, error } = await supabase
            .from('users')
            .select('id, wallet_address, ens_name, display_name, avatar_url, reputation_score, seniority_index, age, gender, nationality, self_verified')
            .or(`ens_name.ilike.%${query}%,display_name.ilike.%${query}%,wallet_address.ilike.%${query}%`)
            .order('reputation_score', { ascending: false })
            .limit(20)

        if (error) throw error

        // Return matching users for search results
        return NextResponse.json({ users })
    } catch (error) {
        // Log error for debugging
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}