// API route for sending connection requests between users
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        // Parse wallet addresses from request body
        const { requesterWallet, targetWallet } = await request.json()

        // 1. Get user IDs for requester and target
        const { data: requester } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', requesterWallet)
            .single()

        const { data: target } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', targetWallet)
            .single()

        if (!requester || !target) {
            // User not found in DB
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 2. Check for existing connection request (pending/accepted)
        const { data: existing } = await supabase
            .from('connection_requests')
            .select('*')
            .or(`and(requester_id.eq.${requester.id},target_id.eq.${target.id}),and(requester_id.eq.${target.id},target_id.eq.${requester.id})`)
            .in('status', ['pending', 'accepted'])
            .single()

        if (existing) {
            // Prevent duplicate/pending connections
            return NextResponse.json({ error: 'Connection already exists or pending' }, { status: 400 })
        }

        // 3. Create new connection request
        const { data: connection, error } = await supabase
            .from('connection_requests')
            .insert({
                requester_id: requester.id,
                target_id: target.id
            })
            .select()
            .single()

        if (error) throw error

        // Return created connection request
        return NextResponse.json({ connection })
    } catch (error) {
        // Log error for debugging
        console.error('Connection request error:', error)
        return NextResponse.json({ error: 'Failed to send connection request' }, { status: 500 })
    }
}