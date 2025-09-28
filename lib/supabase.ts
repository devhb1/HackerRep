import { createClient } from '@supabase/supabase-js'

// Create Supabase client conditionally
export const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables not configured')
    }

    return createClient(supabaseUrl, supabaseKey)
}

// For backward compatibility - lazy initialization
export const supabase = typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? getSupabaseClient()
    : null as any

export type User = {
    id: string
    wallet_address: string
    ens_name?: string
    display_name: string
    avatar_url?: string
    github_username?: string
    seniority_index?: number
    reputation_score?: number
    // Self Protocol demographic fields
    self_verified?: boolean
    verification_level?: number
    nationality?: string
    gender?: string
    age?: number
    voting_eligible?: boolean
    // Legacy fields (if still needed)
    reputation?: number
    total_upvotes?: number
    total_downvotes?: number
    total_connections?: number
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

// Self Protocol Types
export type SelfVerification = {
    id: string
    wallet_address: string
    nationality: string
    gender: string
    age: number
    identity_commitment: string
    verification_status: 'pending' | 'verified' | 'expired' | 'revoked'
    verified_at: string
    revoked_at?: string
    tx_hash?: string
    block_number?: number
    created_at: string
    updated_at: string
}

export type VerificationSession = {
    id: string
    session_id: string
    wallet_address: string
    user_agent?: string
    ip_address?: string
    expires_at: string
    self_app_config: any
    qr_code_data?: string
    universal_link?: string
    status: 'pending' | 'qr_generated' | 'user_scanned' | 'verifying' | 'verified' | 'failed' | 'expired' | 'cancelled'
    verification_data?: any
    contract_tx_hash?: string
    block_number?: number
    error_message?: string
    retry_count: number
    created_at: string
    updated_at: string
    qr_generated_at?: string
    user_scanned_at?: string
    verifying_at?: string
    completed_at?: string
}

export type SessionEvent = {
    id: string
    session_id: string
    event_type: string
    event_data?: any
    created_at: string
}

// Demographic Analytics Types
export type DemographicStats = {
    total_users: number
    verified_users: number
    india_users: number
    male_users: number
    female_users: number
    avg_age: number
    verification_rate: number
}

export type DemographicAnalytics = {
    nationality: string
    gender: string
    user_count: number
    avg_age: number
    avg_reputation: number
    verified_count: number
    verification_percentage: number
}

// Enhanced User with Demographics
export type UserWithDemographics = User & {
    verification_badge?: string
    education_score?: number
    github_score?: number
    social_score?: number
    total_base_score?: number
    reputation_tier?: string
    completed_onboarding?: boolean
}

// Verification Status Types
export type VerificationStatus = 'pending' | 'verified' | 'expired' | 'revoked'
export type SessionStatus = 'pending' | 'qr_generated' | 'user_scanned' | 'verifying' | 'verified' | 'failed' | 'expired' | 'cancelled'