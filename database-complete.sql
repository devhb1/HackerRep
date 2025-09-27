-- ========================================
-- Main DB schema for HackerRep. Run ONCE in Supabase SQL Editor.
-- This file contains the full schema, triggers, functions, and policies for the reputation and ZK system.

-- ========================================
-- 1. CORE TABLES (Already exist, but ensuring consistency)
-- ========================================

-- Users table (should already exist)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    ens_name TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    reputation INTEGER DEFAULT 100,
    total_upvotes INTEGER DEFAULT 0,
    total_downvotes INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection requests (should already exist)
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ
);

-- Votes table (should already exist) 
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    connection_request_id UUID REFERENCES connection_requests(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table (should already exist)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. ZK CREDENTIALS SYSTEM - NEW TABLES
-- ========================================

-- Main ZK credentials table - stores reputation scores and ZK proofs
CREATE TABLE IF NOT EXISTS zk_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    
    -- zkPDF-based ZK Proof Reputation Scores (0-500 total possible)
    -- Academic credentials verified via zkPDF proof generation from uploaded PDF certificates
    education_score INTEGER DEFAULT 0 CHECK (education_score >= 0 AND education_score <= 200),
    -- GitHub contributions verified via zkPDF proof generation from OAuth-connected GitHub stats  
    github_score INTEGER DEFAULT 0 CHECK (github_score >= 0 AND github_score <= 200), 
    -- Social reputation from peer voting (future implementation)
    social_score INTEGER DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
    total_base_score INTEGER GENERATED ALWAYS AS (education_score + github_score + social_score) STORED,
    
    -- Credential flags
    has_degree BOOLEAN DEFAULT FALSE,
    has_certification BOOLEAN DEFAULT FALSE,
    github_username TEXT,
    
    -- zkPDF ZK Proof Storage (JSONB for flexibility)
    -- Stores academic ZK proofs with commitments/nullifiers from PDF certificate verification
    education_proofs JSONB DEFAULT '[]'::jsonb,
    -- Stores GitHub ZK proofs with commitments/nullifiers from OAuth GitHub stats verification
    github_proofs JSONB DEFAULT '[]'::jsonb,
    -- Raw GitHub stats for reference (commits, repos, languages, etc.)
    github_data JSONB DEFAULT '{}'::jsonb,
    
    -- zkPDF Reputation tier (auto-calculated from ZK-verified scores)
    reputation_tier TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN (education_score + github_score + social_score) >= 500 THEN 'blockchain-expert'
            WHEN (education_score + github_score + social_score) >= 300 THEN 'senior-dev' 
            WHEN (education_score + github_score + social_score) >= 200 THEN 'developer'
            WHEN (education_score + github_score + social_score) >= 100 THEN 'student'
            ELSE 'newcomer'
        END
    ) STORED,
    
    -- Onboarding status
    completed_onboarding BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENS subnames earned by users based on reputation
CREATE TABLE IF NOT EXISTS ens_subnames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES zk_credentials(wallet_address) ON DELETE CASCADE,
    
    subname TEXT NOT NULL,                    -- 'student', 'dev', 'senior-dev', etc.
    full_ens_name TEXT,                       -- 'student.alice.eth' 
    required_score INTEGER NOT NULL,          -- Score threshold to earn this subname
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(wallet_address, subname)
);

-- Track credential upload attempts and ZK proof generation
CREATE TABLE IF NOT EXISTS credential_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES zk_credentials(wallet_address) ON DELETE CASCADE,
    
    upload_type TEXT NOT NULL,                -- 'education_certificate', 'github_oauth'
    file_hash TEXT,                          -- SHA256 hash of uploaded file
    zk_proof_hash TEXT,                      -- Generated ZK proof hash
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    score_awarded INTEGER DEFAULT 0,
    
    -- Store file metadata and processing info
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_ens ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_target ON connection_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted_for ON votes(voted_for_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

-- ZK table indexes
CREATE INDEX IF NOT EXISTS idx_zk_credentials_wallet ON zk_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_score ON zk_credentials(total_base_score DESC);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_tier ON zk_credentials(reputation_tier);
CREATE INDEX IF NOT EXISTS idx_ens_subnames_wallet ON ens_subnames(wallet_address);
CREATE INDEX IF NOT EXISTS idx_credential_uploads_wallet ON credential_uploads(wallet_address);
CREATE INDEX IF NOT EXISTS idx_credential_uploads_type ON credential_uploads(upload_type);

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ens_subnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_uploads ENABLE ROW LEVEL SECURITY;

-- Simple policies for development (allow all operations)
-- TODO: Implement proper policies for production

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on connection_requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow all operations on votes" ON votes;
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
DROP POLICY IF EXISTS "Allow all operations on zk_credentials" ON zk_credentials;
DROP POLICY IF EXISTS "Allow all operations on ens_subnames" ON ens_subnames;
DROP POLICY IF EXISTS "Allow all operations on credential_uploads" ON credential_uploads;

-- Create policies
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on connection_requests" ON connection_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all operations on activities" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all operations on zk_credentials" ON zk_credentials FOR ALL USING (true);
CREATE POLICY "Allow all operations on ens_subnames" ON ens_subnames FOR ALL USING (true);
CREATE POLICY "Allow all operations on credential_uploads" ON credential_uploads FOR ALL USING (true);

-- ========================================
-- 5. FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update user reputation from social scores
CREATE OR REPLACE FUNCTION sync_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's main reputation score when ZK credentials change
    UPDATE users 
    SET 
        reputation = 100 + NEW.total_base_score,
        updated_at = NOW()
    WHERE wallet_address = NEW.wallet_address;
    
    -- Update the updated_at timestamp on ZK credentials
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync reputation scores (drop if exists first)
DROP TRIGGER IF EXISTS trigger_sync_user_reputation ON zk_credentials;
CREATE TRIGGER trigger_sync_user_reputation
    BEFORE INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_reputation();

-- Function to auto-award ENS subnames based on score thresholds
CREATE OR REPLACE FUNCTION check_ens_subname_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    user_ens_name TEXT;
BEGIN
    -- Get the user's primary ENS name
    SELECT ens_name INTO user_ens_name 
    FROM users 
    WHERE wallet_address = NEW.wallet_address;
    
    -- Only proceed if user has an ENS name
    IF user_ens_name IS NOT NULL THEN
        -- Award subnames based on score thresholds
        
        -- Student level (100+ points)
        IF NEW.total_base_score >= 100 AND NOT EXISTS (
            SELECT 1 FROM ens_subnames 
            WHERE wallet_address = NEW.wallet_address AND subname = 'student'
        ) THEN
            INSERT INTO ens_subnames (wallet_address, subname, full_ens_name, required_score)
            VALUES (NEW.wallet_address, 'student', 'student.' || user_ens_name, 100);
        END IF;
        
        -- Developer level (200+ points)  
        IF NEW.total_base_score >= 200 AND NOT EXISTS (
            SELECT 1 FROM ens_subnames 
            WHERE wallet_address = NEW.wallet_address AND subname = 'dev'
        ) THEN
            INSERT INTO ens_subnames (wallet_address, subname, full_ens_name, required_score)
            VALUES (NEW.wallet_address, 'dev', 'dev.' || user_ens_name, 200);
        END IF;
        
        -- Senior Developer level (400+ points)
        IF NEW.total_base_score >= 400 AND NOT EXISTS (
            SELECT 1 FROM ens_subnames 
            WHERE wallet_address = NEW.wallet_address AND subname = 'senior-dev'
        ) THEN
            INSERT INTO ens_subnames (wallet_address, subname, full_ens_name, required_score)
            VALUES (NEW.wallet_address, 'senior-dev', 'senior-dev.' || user_ens_name, 400);
        END IF;
        
        -- Blockchain Expert level (600+ points)
        IF NEW.total_base_score >= 600 AND NOT EXISTS (
            SELECT 1 FROM ens_subnames 
            WHERE wallet_address = NEW.wallet_address AND subname = 'blockchain-expert'
        ) THEN
            INSERT INTO ens_subnames (wallet_address, subname, full_ens_name, required_score)
            VALUES (NEW.wallet_address, 'blockchain-expert', 'blockchain-expert.' || user_ens_name, 600);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-award ENS subnames (drop if exists first)
DROP TRIGGER IF EXISTS trigger_check_ens_subnames ON zk_credentials;
CREATE TRIGGER trigger_check_ens_subnames
    AFTER INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION check_ens_subname_eligibility();

-- ========================================
-- 6. HELPER FUNCTIONS FOR API
-- ========================================

-- Function to get user's complete ZK profile
CREATE OR REPLACE FUNCTION get_user_zk_profile(user_wallet VARCHAR(42))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'credentials', zk.*,
        'subnames', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'subname', subname,
                    'full_ens_name', full_ens_name, 
                    'required_score', required_score,
                    'earned_at', earned_at
                )
            )
            FROM ens_subnames 
            WHERE wallet_address = user_wallet AND is_active = true
        ), '[]'::json),
        'recent_uploads', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'upload_type', upload_type,
                    'verification_status', verification_status,
                    'score_awarded', score_awarded,
                    'created_at', created_at
                )
            )
            FROM credential_uploads 
            WHERE wallet_address = user_wallet 
            ORDER BY created_at DESC 
            LIMIT 5
        ), '[]'::json)
    ) INTO result
    FROM zk_credentials zk
    WHERE zk.wallet_address = user_wallet;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. INITIAL DATA & TESTING
-- ========================================

-- Create some test ZK credential records for existing users
INSERT INTO zk_credentials (wallet_address, social_score)
SELECT 
    wallet_address,
    GREATEST(reputation - 100, 0) as social_score
FROM users
WHERE wallet_address NOT IN (SELECT wallet_address FROM zk_credentials)
ON CONFLICT (wallet_address) DO NOTHING;

-- ========================================
-- 8. VERIFICATION & CLEANUP
-- ========================================

-- Clean up any orphaned records
DELETE FROM connection_requests WHERE requester_id NOT IN (SELECT id FROM users);
DELETE FROM connection_requests WHERE target_id NOT IN (SELECT id FROM users);
DELETE FROM votes WHERE voter_id NOT IN (SELECT id FROM users);
DELETE FROM votes WHERE voted_for_id NOT IN (SELECT id FROM users);

-- Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ HackerRep Database Setup Complete!';
    RAISE NOTICE '📊 Tables created: users, connection_requests, votes, activities, zk_credentials, ens_subnames, credential_uploads';
    RAISE NOTICE '🔧 Functions created: sync_user_reputation, check_ens_subname_eligibility, get_user_zk_profile';
    RAISE NOTICE '⚡ Triggers created: Auto-sync reputation, Auto-award ENS subnames';
    RAISE NOTICE '🎯 Ready for Phase 4: ZK Credentials + Phase 7-9: ENS Dynamic Identity';
END $$;

-- Show current state
SELECT 
    'Database Setup Summary' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM zk_credentials) as zk_profiles,
    (SELECT COUNT(*) FROM ens_subnames) as earned_subnames;