import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns pending connection requests for the logged-in user
export async function GET(request: Request) {
    // TODO: Replace with real user auth
    const userWallet = request.headers.get('x-wallet')
    if (!userWallet) return NextResponse.json({ requests: [] })

    // Find user ID
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', userWallet)
        .single()
    if (!user) return NextResponse.json({ requests: [] })

    // Get pending requests where target is this user
    const { data: requests } = await supabase
        .from('connection_requests')
        .select('id, requester_id, status')
        .eq('target_id', user.id)
        .eq('status', 'pending')

    // Fetch requester info for each request
    const detailed = await Promise.all((requests || []).map(async (req: any) => {
        const { data: requester } = await supabase
            .from('users')
            .select('ens_name, display_name, wallet_address')
            .eq('id', req.requester_id)
            .single()
        return {
            id: req.id,
            requester_ens: requester?.ens_name,
            requester_display: requester?.display_name,
            requester_wallet: requester?.wallet_address
        }
    }))

    return NextResponse.json({ requests: detailed })
}
