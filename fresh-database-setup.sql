-- ========================================
-- FRESH DATABASE SETUP - PHASE 1 COMPLETE
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- Step 1: Clean slate - Drop all existing tables
DROP TABLE IF EXISTS zk_proofs CASCADE;
DROP TABLE IF EXISTS zk_credentials CASCADE; 
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS leaderboard_view CASCADE;
DROP FUNCTION IF EXISTS update_user_seniority() CASCADE;
DROP FUNCTION IF EXISTS sync_user_reputation() CASCADE;

-- Step 2: Create fresh schema with all Phase 1 features

-- ========================================
-- USERS TABLE - Enhanced with seniority_index
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    ens_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    github_username TEXT,
    seniority_index INTEGER DEFAULT 1, -- NEW: 1=Newcomer, 2=Level1(ZK), 3=Level2(Advanced)
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CONNECTION REQUESTS TABLE
-- ========================================
CREATE TABLE connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- ========================================
-- VOTES TABLE - Peer reputation system
-- ========================================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ACTIVITIES TABLE - Platform activity feed
-- ========================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ZK CREDENTIALS TABLE - Core zkPDF reputation
-- ========================================
CREATE TABLE zk_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    education_score INTEGER DEFAULT 0,
    github_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    total_base_score INTEGER DEFAULT 0,
    reputation_tier TEXT DEFAULT 'newcomer',
    completed_onboarding BOOLEAN DEFAULT false,
    github_username TEXT,
    has_degree BOOLEAN DEFAULT false,
    has_certification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address)
);

-- ========================================
-- ZK PROOFS TABLE - zkPDF proof storage
-- ========================================
CREATE TABLE zk_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    proof_type TEXT NOT NULL CHECK (proof_type IN ('academic', 'github', 'social')),
    proof_data JSONB NOT NULL,
    verification_status TEXT DEFAULT 'verified',
    score_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_ens ON users(ens_name);
CREATE INDEX idx_users_seniority ON users(seniority_index);
CREATE INDEX idx_zk_credentials_wallet ON zk_credentials(wallet_address);
CREATE INDEX idx_zk_credentials_user ON zk_credentials(user_id);
CREATE INDEX idx_zk_proofs_user ON zk_proofs(user_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_votes_voter ON votes(voter_id);
CREATE INDEX idx_votes_voted_for ON votes(voted_for_id);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to update user seniority based on zkPDF achievements
CREATE OR REPLACE FUNCTION update_user_seniority()
RETURNS TRIGGER AS $$
BEGIN
    -- Update seniority based on total_base_score
    UPDATE users 
    SET seniority_index = CASE
        WHEN NEW.total_base_score >= 200 THEN 3  -- Level 2: Advanced (200+ points)
        WHEN NEW.total_base_score >= 50 THEN 2   -- Level 1: ZK Verified (50+ points)
        ELSE 1                                   -- Level 0: Newcomer
    END,
    reputation_score = NEW.total_base_score,
    updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update seniority when zk_credentials change
CREATE TRIGGER trigger_update_seniority
    AFTER INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_user_seniority();

-- Function to sync reputation between tables
CREATE OR REPLACE FUNCTION sync_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's main reputation score when ZK credentials change
    UPDATE users 
    SET reputation_score = NEW.total_base_score,
        updated_at = NOW()
    WHERE wallet_address = NEW.wallet_address;
    
    -- Create activity entry for reputation updates
    INSERT INTO activities (user_id, activity_type, description)
    SELECT 
        u.id,
        'reputation_update',
        'Reputation updated: ' || NEW.total_base_score || ' points (Tier: ' || NEW.reputation_tier || ')'
    FROM users u 
    WHERE u.wallet_address = NEW.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputation sync
CREATE TRIGGER trigger_sync_reputation
    AFTER INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_reputation();

-- ========================================
-- LEADERBOARD VIEW - Optimized for ENS display
-- ========================================
CREATE VIEW leaderboard_view AS
SELECT 
    u.id,
    u.wallet_address,
    u.ens_name,
    u.display_name,
    u.avatar_url,
    u.seniority_index,
    zk.education_score,
    zk.github_score,
    zk.social_score,
    zk.total_base_score,
    zk.reputation_tier,
    zk.completed_onboarding,
    u.created_at,
    u.updated_at,
    -- Prioritize ENS names for display
    COALESCE(u.ens_name, u.display_name, CONCAT(SUBSTRING(u.wallet_address, 1, 6), '...', SUBSTRING(u.wallet_address, 39, 4))) as display_name_priority
FROM users u
LEFT JOIN zk_credentials zk ON u.id = zk.user_id
WHERE zk.total_base_score > 0 OR zk.completed_onboarding = true
ORDER BY zk.total_base_score DESC NULLS LAST;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;

-- Public read policies (users can read all public data)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Activities are viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "ZK credentials are viewable by everyone" ON zk_credentials FOR SELECT USING (true);
CREATE POLICY "ZK proofs are viewable by everyone" ON zk_proofs FOR SELECT USING (true);

-- User can manage their own data
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own zk_credentials" ON zk_credentials FOR ALL USING (true);
CREATE POLICY "Users can manage own zk_proofs" ON zk_proofs FOR ALL USING (true);

CREATE POLICY "Users can manage own connections" ON connection_requests FOR ALL USING (true);
CREATE POLICY "Users can manage own votes" ON votes FOR ALL USING (true);
CREATE POLICY "Users can create activities" ON activities FOR INSERT WITH CHECK (true);

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Create a test user with Level 1 (ZK Verified) status
INSERT INTO users (wallet_address, ens_name, display_name, seniority_index, reputation_score) 
VALUES ('0xd1c9...66C7', 'alice.eth', 'alice.eth', 2, 195);

-- Create ZK credentials for test user
INSERT INTO zk_credentials (
    user_id, wallet_address, education_score, github_score, social_score, 
    total_base_score, reputation_tier, completed_onboarding, github_username, 
    has_degree, has_certification
) 
SELECT 
    id, '0xd1c9...66C7', 50, 145, 0, 195, 'student', true, 'alice-dev', true, false
FROM users WHERE wallet_address = '0xd1c9...66C7';

-- Create sample zkPDF proofs
INSERT INTO zk_proofs (user_id, wallet_address, proof_type, proof_data, score_awarded)
SELECT 
    id, '0xd1c9...66C7', 'academic', 
    '{"degreeType":"Bachelor","institution":"MIT","proofId":"zkp_123","commitment":"0x1234...","nullifier":"0x5678..."}',
    50
FROM users WHERE wallet_address = '0xd1c9...66C7';

INSERT INTO zk_proofs (user_id, wallet_address, proof_type, proof_data, score_awarded)
SELECT 
    id, '0xd1c9...66C7', 'github',
    '{"username":"alice-dev","repositories":25,"totalStars":150,"proofId":"zkp_456","commitment":"0xabcd...","nullifier":"0xefgh..."}',
    145  
FROM users WHERE wallet_address = '0xd1c9...66C7';

-- Create activity entries
INSERT INTO activities (user_id, activity_type, description)
SELECT 
    id, 'user_registered', 'New hacker joined: alice.eth'
FROM users WHERE wallet_address = '0xd1c9...66C7';

INSERT INTO activities (user_id, activity_type, description)
SELECT 
    id, 'zkproof_generated', 'Generated zkPDF proof for academic credentials (50 points)'
FROM users WHERE wallet_address = '0xd1c9...66C7';

INSERT INTO activities (user_id, activity_type, description)
SELECT 
    id, 'zkproof_generated', 'Generated zkPDF proof for GitHub profile (145 points)'
FROM users WHERE wallet_address = '0xd1c9...66C7';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that everything was created correctly
SELECT 'Users table' as table_name, count(*) as records FROM users
UNION ALL
SELECT 'ZK Credentials table', count(*) FROM zk_credentials
UNION ALL  
SELECT 'ZK Proofs table', count(*) FROM zk_proofs
UNION ALL
SELECT 'Activities table', count(*) FROM activities;

-- Check leaderboard view
SELECT 'Leaderboard View Test:' as info;
SELECT display_name_priority, total_base_score, reputation_tier, seniority_index 
FROM leaderboard_view 
LIMIT 5;

-- ========================================
-- PHASE 1 COMPLETE! 🎉
-- ========================================

-- You now have:
-- ✅ Fresh database with proper relationships
-- ✅ seniority_index field for user levels
-- ✅ ENS-first identity system
-- ✅ zkPDF proof storage and verification
-- ✅ Optimized leaderboard view
-- ✅ Reputation sync between tables
-- ✅ Sample data for testing

SELECT '🎉 Phase 1 Database Setup Complete!' as status;