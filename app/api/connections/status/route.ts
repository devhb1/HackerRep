import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Check connection status between two users
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const currentWallet = searchParams.get('current')
    const targetWallet = searchParams.get('target')

    if (!currentWallet || !targetWallet) {
        return NextResponse.json({ status: 'none' })
    }

    try {
        // Get user IDs for both users
        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', currentWallet)
            .single()

        const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', targetWallet)
            .single()

        if (!currentUser || !targetUser) {
            return NextResponse.json({ status: 'none' })
        }

        // Check for any connection request between these users (in either direction)
        const { data: connection } = await supabase
            .from('connection_requests')
            .select('status, requester_id, target_id')
            .or(`and(requester_id.eq.${currentUser.id},target_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},target_id.eq.${currentUser.id})`)
            .in('status', ['pending', 'accepted'])
            .single()

        if (connection) {
            // If current user sent the request and it's pending
            if (connection.requester_id === currentUser.id && connection.status === 'pending') {
                return NextResponse.json({ status: 'pending_sent' })
            }
            // If target user sent the request and it's pending
            if (connection.requester_id === targetUser.id && connection.status === 'pending') {
                return NextResponse.json({ status: 'pending_received' })
            }
            // If connection is accepted
            if (connection.status === 'accepted') {
                return NextResponse.json({ status: 'connected' })
            }
        }

        return NextResponse.json({ status: 'none' })
    } catch (error) {
        console.error('Connection status check error:', error)
        return NextResponse.json({ status: 'none' })
    }
}