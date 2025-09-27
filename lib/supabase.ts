import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type User = {
    id: string
    wallet_address: string
    ens_name?: string
    display_name: string
    avatar_url?: string
    reputation: number
    total_upvotes: number
    total_downvotes: number
    total_connections: number
    created_at: string
    updated_at: string
}

export type ConnectionRequest = {
    id: string
    requester_id: string
    target_id: string
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
    created_at: string
    expires_at: string
    accepted_at?: string
}

export type Vote = {
    id: string
    voter_id: string
    voted_for_id: string
    vote_type: 'upvote' | 'downvote'
    connection_request_id: string
    created_at: string
}