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

export type ZKCredentials = {
    id: string
    wallet_address: string
    education_score: number
    github_score: number
    social_score: number
    total_base_score: number
    reputation_tier: 'newcomer' | 'student' | 'developer' | 'senior-dev' | 'blockchain-expert'
    completed_onboarding: boolean
    has_degree: boolean
    has_certification: boolean
    github_username: string | null
    github_data: any
    education_proofs: any
    github_proofs: any
    created_at: string
    updated_at: string
}

export type ENSSubname = {
    id: string
    wallet_address: string
    subname: string
    full_ens_name: string | null
    required_score: number
    earned_at: string
    is_active: boolean
}

export type CredentialUpload = {
    id: string
    wallet_address: string
    upload_type: string
    file_hash: string | null
    zk_proof_hash: string | null
    verification_status: 'pending' | 'verified' | 'failed'
    score_awarded: number
    metadata: any
    created_at: string
}