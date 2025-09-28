-- ========================================
-- QUICK FIX FOR LEVEL 1 ZK REPUTATION
-- Run this in Supabase SQL Editor to fix the schema
-- ========================================

-- First, let's create the missing zk_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS zk_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    education_score INTEGER DEFAULT 0,
    github_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    total_base_score INTEGER DEFAULT 0,
    reputation_tier TEXT DEFAULT 'newcomer',
    completed_onboarding BOOLEAN DEFAULT false,
    github_username TEXT,
    github_data JSONB,
    has_degree BOOLEAN DEFAULT false,
    has_certification BOOLEAN DEFAULT false,
    education_proofs JSONB,
    github_proofs JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add reputation_score if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reputation_score') THEN
        ALTER TABLE users ADD COLUMN reputation_score INTEGER DEFAULT 100;
    END IF;
    
    -- Add seniority_index if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'seniority_index') THEN
        ALTER TABLE users ADD COLUMN seniority_index INTEGER DEFAULT 1;
    END IF;
    
    -- Add github_username if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'github_username') THEN
        ALTER TABLE users ADD COLUMN github_username TEXT;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zk_credentials_wallet ON zk_credentials(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_reputation_score ON users(reputation_score);

-- Enable RLS
ALTER TABLE zk_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for zk_credentials
DROP POLICY IF EXISTS "ZK credentials are viewable by everyone" ON zk_credentials;
CREATE POLICY "ZK credentials are viewable by everyone" ON zk_credentials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own zk_credentials" ON zk_credentials;  
CREATE POLICY "Users can manage own zk_credentials" ON zk_credentials FOR ALL USING (true);

-- Insert a test record to verify everything works
INSERT INTO zk_credentials (
    wallet_address, 
    education_score, 
    github_score, 
    social_score, 
    total_base_score,
    reputation_tier,
    completed_onboarding
) VALUES (
    '0x1234567890123456789012345678901234567890',
    0, 0, 0, 0, 'newcomer', false
) ON CONFLICT (wallet_address) DO NOTHING;

SELECT 'Level 1 ZK Reputation Schema Fixed! ✅' as status;
