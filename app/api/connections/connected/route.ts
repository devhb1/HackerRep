import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns users who have accepted connections with the current user
export async function GET(request: Request) {
    const userWallet = request.headers.get('x-wallet')
    if (!userWallet) return NextResponse.json({ users: [] })

    try {
        // Find current user ID
        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', userWallet)
            .single()

        if (!currentUser) return NextResponse.json({ users: [] })

        // Get accepted connection requests where current user is either requester or target
        const { data: connections } = await supabase
            .from('connection_requests')
            .select('requester_id, target_id')
            .or(`requester_id.eq.${currentUser.id},target_id.eq.${currentUser.id}`)
            .eq('status', 'accepted')

        if (!connections || connections.length === 0) {
            return NextResponse.json({ users: [] })
        }

        // Get the other user IDs from the connections
        const connectedUserIds = connections.map((conn: any) =>
            conn.requester_id === currentUser.id ? conn.target_id : conn.requester_id
        )

        // Fetch user details for connected users
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .in('id', connectedUserIds)

        return NextResponse.json({ users: users || [] })
    } catch (error) {
        console.error('Connected users fetch error:', error)
        return NextResponse.json({ users: [] })
    }
}