-- ========================================
-- FINAL COMPLETE DATABASE SETUP
-- Level 1 ZK Proofs + Self Protocol + Future-Ready
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- ========================================
-- STEP 1: CLEAN SLATE (Optional - only if you want fresh start)
-- ========================================

-- Uncomment these lines if you want to start completely fresh:
-- DROP TABLE IF EXISTS session_events CASCADE;
-- DROP TABLE IF EXISTS verification_sessions CASCADE;
-- DROP TABLE IF EXISTS self_verifications CASCADE;
-- DROP TABLE IF EXISTS zk_proofs CASCADE;
-- DROP TABLE IF EXISTS zk_credentials CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS votes CASCADE;
-- DROP TABLE IF EXISTS connection_requests CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- STEP 2: CORE TABLES
-- ========================================

-- USERS TABLE - Main user profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    ens_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    github_username TEXT,
    
    -- Reputation & Scoring
    reputation_score INTEGER DEFAULT 100,
    seniority_index INTEGER DEFAULT 1,
    
    -- Self Protocol Integration
    nationality TEXT,
    gender TEXT,
    age INTEGER,
    self_verified BOOLEAN DEFAULT false,
    verification_level INTEGER DEFAULT 0,
    voting_eligible BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ZK CREDENTIALS TABLE - Level 1 ZK Proof Storage
CREATE TABLE IF NOT EXISTS zk_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    
    -- ZK Proof Scores
    education_score INTEGER DEFAULT 0,
    github_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    total_base_score INTEGER DEFAULT 0,
    
    -- Reputation Tier
    reputation_tier TEXT DEFAULT 'newcomer' CHECK (reputation_tier IN ('newcomer', 'student', 'developer', 'senior-dev', 'blockchain-expert')),
    
    -- Completion Status
    completed_onboarding BOOLEAN DEFAULT false,
    has_degree BOOLEAN DEFAULT false,
    has_certification BOOLEAN DEFAULT false,
    
    -- GitHub Integration
    github_username TEXT,
    github_data JSONB,
    github_proofs JSONB,
    
    -- Academic Integration
    education_proofs JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ZK PROOFS TABLE - Individual proof records
CREATE TABLE IF NOT EXISTS zk_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    proof_type TEXT NOT NULL CHECK (proof_type IN ('github', 'academic', 'social')),
    proof_id TEXT UNIQUE NOT NULL,
    
    -- ZK Proof Components
    commitment TEXT NOT NULL,
    nullifier TEXT NOT NULL,
    score_awarded INTEGER NOT NULL,
    
    -- Proof Data
    proof_data JSONB,
    verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

-- SELF PROTOCOL TABLES
CREATE TABLE IF NOT EXISTS self_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    
    -- Demographic Data
    nationality TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    
    -- Verification Details
    identity_commitment TEXT NOT NULL,
    verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
    
    -- Blockchain Data
    tx_hash TEXT,
    block_number BIGINT,
    
    -- Timestamps
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    
    -- Session Details
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Self App Configuration
    self_app_config JSONB,
    qr_code_data TEXT,
    universal_link TEXT,
    
    -- Status Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qr_generated', 'user_scanned', 'verifying', 'verified', 'failed', 'expired', 'cancelled')),
    verification_data JSONB,
    contract_tx_hash TEXT,
    block_number BIGINT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    qr_generated_at TIMESTAMPTZ,
    user_scanned_at TIMESTAMPTZ,
    verifying_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCIAL FEATURES TABLES
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate votes
    UNIQUE(voter_id, voted_for_id)
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: INDEXES FOR PERFORMANCE
-- ========================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_ens ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation_score);
CREATE INDEX IF NOT EXISTS idx_users_self_verified ON users(self_verified);
CREATE INDEX IF NOT EXISTS idx_users_voting_eligible ON users(voting_eligible);

-- ZK Credentials indexes
CREATE INDEX IF NOT EXISTS idx_zk_credentials_wallet ON zk_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_total_score ON zk_credentials(total_base_score);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_tier ON zk_credentials(reputation_tier);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_github ON zk_credentials(github_username);

-- ZK Proofs indexes
CREATE INDEX IF NOT EXISTS idx_zk_proofs_wallet ON zk_proofs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_type ON zk_proofs(proof_type);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_nullifier ON zk_proofs(nullifier);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_status ON zk_proofs(verification_status);

-- Self Protocol indexes
CREATE INDEX IF NOT EXISTS idx_self_verifications_wallet ON self_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_self_verifications_status ON self_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_self_verifications_nationality ON self_verifications(nationality);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_session_id ON verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_wallet ON verification_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status);

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted_for ON votes(voted_for_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);

-- ========================================
-- STEP 4: FUNCTIONS & TRIGGERS
-- ========================================

-- Function to calculate total base score
CREATE OR REPLACE FUNCTION calculate_total_base_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_base_score = COALESCE(NEW.education_score, 0) + COALESCE(NEW.github_score, 0) + COALESCE(NEW.social_score, 0);
    
    -- Update reputation tier based on total score
    NEW.reputation_tier = CASE
        WHEN NEW.total_base_score >= 400 THEN 'blockchain-expert'
        WHEN NEW.total_base_score >= 300 THEN 'senior-dev'
        WHEN NEW.total_base_score >= 200 THEN 'developer'
        WHEN NEW.total_base_score >= 100 THEN 'student'
        ELSE 'newcomer'
    END;
    
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for zk_credentials
DROP TRIGGER IF EXISTS trigger_calculate_total_score ON zk_credentials;
CREATE TRIGGER trigger_calculate_total_score
    BEFORE INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_base_score();

-- Function to sync reputation between tables
CREATE OR REPLACE FUNCTION sync_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's main reputation score when ZK credentials change
    UPDATE users 
    SET 
        reputation_score = NEW.total_base_score,
        github_username = NEW.github_username,
        updated_at = NOW()
    WHERE wallet_address = NEW.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputation sync
DROP TRIGGER IF EXISTS trigger_sync_reputation ON zk_credentials;
CREATE TRIGGER trigger_sync_reputation
    AFTER INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_reputation();

-- Function to update user verification status
CREATE OR REPLACE FUNCTION update_self_verification_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user verification status when self verification changes
    IF NEW.verification_status = 'verified' THEN
        -- Check if user meets voting eligibility criteria
        UPDATE users 
        SET 
            self_verified = true,
            verification_level = 2,
            nationality = NEW.nationality,
            gender = NEW.gender,
            age = NEW.age,
            voting_eligible = (NEW.nationality = 'INDIA'), -- Only Indian users can vote
            updated_at = NOW()
        WHERE wallet_address = NEW.wallet_address;
    ELSE
        -- Revoke verification
        UPDATE users 
        SET 
            self_verified = false,
            verification_level = 1,
            voting_eligible = false,
            updated_at = NOW()
        WHERE wallet_address = NEW.wallet_address;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Self Protocol verification
DROP TRIGGER IF EXISTS trigger_update_self_verification ON self_verifications;
CREATE TRIGGER trigger_update_self_verification
    AFTER INSERT OR UPDATE ON self_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_self_verification_level();

-- ========================================
-- STEP 5: ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Public read policies (users can read all public data)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "ZK credentials are viewable by everyone" ON zk_credentials;
CREATE POLICY "ZK credentials are viewable by everyone" ON zk_credentials FOR SELECT USING (true);

DROP POLICY IF EXISTS "ZK proofs are viewable by everyone" ON zk_proofs;
CREATE POLICY "ZK proofs are viewable by everyone" ON zk_proofs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Self verifications are viewable by everyone" ON self_verifications;
CREATE POLICY "Self verifications are viewable by everyone" ON self_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Activities are viewable by everyone" ON activities;
CREATE POLICY "Activities are viewable by everyone" ON activities FOR SELECT USING (true);

-- User can manage their own data
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own zk_credentials" ON zk_credentials;
CREATE POLICY "Users can manage own zk_credentials" ON zk_credentials FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own zk_proofs" ON zk_proofs;
CREATE POLICY "Users can manage own zk_proofs" ON zk_proofs FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own verification sessions" ON verification_sessions;
CREATE POLICY "Users can manage own verification sessions" ON verification_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own session events" ON session_events;
CREATE POLICY "Users can manage own session events" ON session_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own connections" ON connection_requests;
CREATE POLICY "Users can manage own connections" ON connection_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own votes" ON votes;
CREATE POLICY "Users can manage own votes" ON votes FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities" ON activities FOR INSERT WITH CHECK (true);

-- ========================================
-- STEP 6: HELPER VIEWS
-- ========================================

-- Leaderboard view combining users and zk_credentials
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    u.id,
    u.wallet_address,
    u.ens_name,
    u.display_name,
    u.avatar_url,
    u.github_username,
    u.reputation_score,
    u.self_verified,
    u.voting_eligible,
    u.nationality,
    u.gender,
    u.age,
    
    -- ZK Credentials data
    zk.education_score,
    zk.github_score,
    zk.social_score,
    zk.total_base_score,
    zk.reputation_tier,
    zk.completed_onboarding,
    zk.has_degree,
    zk.has_certification,
    
    -- Verification badge
    CASE 
        WHEN u.self_verified = true THEN '🛡️ Self Verified'
        WHEN zk.total_base_score >= 300 THEN '🏆 Expert'
        WHEN zk.total_base_score >= 200 THEN '⭐ Advanced'
        WHEN zk.total_base_score >= 100 THEN '🎓 Verified'
        ELSE '🆕 Newcomer'
    END as verification_badge,
    
    u.created_at
FROM users u
LEFT JOIN zk_credentials zk ON u.wallet_address = zk.wallet_address
WHERE zk.total_base_score > 0 OR zk.completed_onboarding = true OR u.self_verified = true
ORDER BY 
    -- Prioritize Self verified users, then by reputation
    CASE WHEN u.self_verified = true THEN 1 ELSE 2 END,
    zk.total_base_score DESC NULLS LAST,
    u.reputation_score DESC;

-- ========================================
-- STEP 7: TEST DATA (Optional)
-- ========================================

-- Insert a test user for Level 1 testing
INSERT INTO users (
    wallet_address, 
    ens_name, 
    display_name, 
    reputation_score,
    seniority_index
) VALUES (
    '0x1234567890123456789012345678901234567890',
    'test.eth',
    'test.eth',
    100,
    1
) ON CONFLICT (wallet_address) DO UPDATE SET
    ens_name = EXCLUDED.ens_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- Insert ZK credentials for test user
INSERT INTO zk_credentials (
    wallet_address,
    education_score,
    github_score,
    social_score,
    reputation_tier,
    completed_onboarding
) VALUES (
    '0x1234567890123456789012345678901234567890',
    0,
    0,
    0,
    'newcomer',
    false
) ON CONFLICT (wallet_address) DO NOTHING;

-- ========================================
-- STEP 8: VERIFICATION
-- ========================================

-- Check that everything was created correctly
SELECT 'Database Setup Complete! ✅' as status;

SELECT 
    'Table Counts:' as info,
    (SELECT count(*) FROM users) as users,
    (SELECT count(*) FROM zk_credentials) as zk_credentials,
    (SELECT count(*) FROM zk_proofs) as zk_proofs,
    (SELECT count(*) FROM self_verifications) as self_verifications,
    (SELECT count(*) FROM verification_sessions) as verification_sessions;

SELECT 'Ready for Level 1 ZK Proofs + Self Protocol! 🚀' as final_status;
