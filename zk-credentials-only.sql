-- ========================================
-- Incremental ZK credentials setup. Use if you already have core tables (users, connections, votes, activities).
-- ========================================
-- This adds ONLY the ZK credentials system to existing database

-- Create ZK credentials table
CREATE TABLE IF NOT EXISTS zk_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    
    -- Score breakdowns (0-600 total possible)
    education_score INTEGER DEFAULT 0 CHECK (education_score >= 0 AND education_score <= 300),
    github_score INTEGER DEFAULT 0 CHECK (github_score >= 0 AND github_score <= 200), 
    social_score INTEGER DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
    total_base_score INTEGER GENERATED ALWAYS AS (education_score + github_score + social_score) STORED,
    
    -- Credential flags
    has_degree BOOLEAN DEFAULT FALSE,
    has_certification BOOLEAN DEFAULT FALSE,
    github_username TEXT,
    
    -- ZK proof storage (JSONB for flexibility)
    education_proofs JSONB DEFAULT '[]'::jsonb,
    github_proofs JSONB DEFAULT '[]'::jsonb,
    github_data JSONB DEFAULT '{}'::jsonb,
    
    -- Reputation tier (auto-calculated)
    reputation_tier TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN (education_score + github_score + social_score) >= 600 THEN 'blockchain-expert'
            WHEN (education_score + github_score + social_score) >= 400 THEN 'senior-dev' 
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

-- ENS subnames table
CREATE TABLE IF NOT EXISTS ens_subnames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES zk_credentials(wallet_address) ON DELETE CASCADE,
    
    subname TEXT NOT NULL,
    full_ens_name TEXT,
    required_score INTEGER NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(wallet_address, subname)
);

-- Credential uploads table
CREATE TABLE IF NOT EXISTS credential_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES zk_credentials(wallet_address) ON DELETE CASCADE,
    
    upload_type TEXT NOT NULL,
    file_hash TEXT,
    zk_proof_hash TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    score_awarded INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zk_credentials_wallet ON zk_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_zk_credentials_score ON zk_credentials(total_base_score DESC);
CREATE INDEX IF NOT EXISTS idx_ens_subnames_wallet ON ens_subnames(wallet_address);
CREATE INDEX IF NOT EXISTS idx_credential_uploads_wallet ON credential_uploads(wallet_address);

-- Enable RLS
ALTER TABLE zk_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ens_subnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_uploads ENABLE ROW LEVEL SECURITY;

-- Simple policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zk_credentials' AND policyname = 'Allow all operations on zk_credentials') THEN
        CREATE POLICY "Allow all operations on zk_credentials" ON zk_credentials FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ens_subnames' AND policyname = 'Allow all operations on ens_subnames') THEN
        CREATE POLICY "Allow all operations on ens_subnames" ON ens_subnames FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credential_uploads' AND policyname = 'Allow all operations on credential_uploads') THEN
        CREATE POLICY "Allow all operations on credential_uploads" ON credential_uploads FOR ALL USING (true);
    END IF;
END
$$;

-- Functions and triggers
CREATE OR REPLACE FUNCTION sync_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        reputation = 100 + NEW.total_base_score,
        updated_at = NOW()
    WHERE wallet_address = NEW.wallet_address;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_reputation ON zk_credentials;
CREATE TRIGGER trigger_sync_user_reputation
    BEFORE INSERT OR UPDATE ON zk_credentials
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_reputation();

-- Sync existing users to ZK credentials
INSERT INTO zk_credentials (wallet_address, social_score)
SELECT 
    wallet_address,
    GREATEST(reputation - 100, 0) as social_score
FROM users
WHERE wallet_address NOT IN (SELECT wallet_address FROM zk_credentials)
ON CONFLICT (wallet_address) DO NOTHING;

-- Success message
SELECT 'ZK Credentials system added successfully!' as status;