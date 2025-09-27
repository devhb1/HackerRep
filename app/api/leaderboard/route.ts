import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns leaderboard sorted by reputation
export async function GET() {
    const { data: users } = await supabase
        .from('users')
        .select('id, ens_name, display_name, wallet_address, reputation, total_upvotes, total_downvotes, total_connections')
        .order('reputation', { ascending: false })
        .limit(50)
    return NextResponse.json({ leaderboard: users || [] })
}
