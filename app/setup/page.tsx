'use client'

import { useState } from 'react'
import { PixelButton } from '@/components/pixel/pixel-button'

export default function SetupPage() {
    const [setupStatus, setSetupStatus] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const setupDatabase = async () => {
        setIsLoading(true)
        setSetupStatus('Setting up database...')

        try {
            // Test if we can access the users table
            const response = await fetch('/api/users/search?q=test', { method: 'GET' })

            if (response.ok) {
                setSetupStatus('✅ Database is already set up and working!')
            } else {
                setSetupStatus(`
❌ Database tables need to be created. 

Please go to your Supabase Dashboard → SQL Editor and run:

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  ens_name TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  reputation INTEGER DEFAULT 100,
  total_upvotes INTEGER DEFAULT 0,
  total_downvotes INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id),
  target_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, target_id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES users(id),
  voted_for_id UUID REFERENCES users(id),
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  connection_request_id UUID REFERENCES connection_requests(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, voted_for_id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_ens ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_connection_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);

Then refresh this page and try again!
        `)
            }
        } catch (error) {
            setSetupStatus(`❌ Error: ${error}`)
        }

        setIsLoading(false)
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
            <h1 className="font-pixel text-2xl text-primary glitch">DATABASE SETUP</h1>

            <div className="pixel-border bg-card p-6">
                <div className="space-y-4">
                    <p className="text-foreground">
                        Click button below to test if our Supabase database is set up correctly:
                    </p>

                    <PixelButton
                        onClick={setupDatabase}
                        disabled={isLoading}
                        variant="primary"
                    >
                        {isLoading ? 'Checking...' : 'Test Database Setup'}
                    </PixelButton>

                    {setupStatus && (
                        <pre className="bg-muted p-4 rounded text-xs overflow-auto whitespace-pre-wrap">
                            {setupStatus}
                        </pre>
                    )}
                </div>
            </div>
        </main>
    )
}