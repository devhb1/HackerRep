import { supabase } from '@/lib/supabase'

async function setupDatabase() {
    try {
        console.log('🔥 Setting up HackerRep database...')

        // Test connection
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1)

        if (testError && testError.code === '42P01') {
            console.log('📋 Tables don\'t exist yet. Creating them...')

            // Since we can't create tables via the client (requires admin access),
            // let's just try to insert a test user to see if tables exist
            const testUser = {
                wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
                display_name: 'test.eth',
                reputation: 100
            }

            const { data: insertData, error: insertError } = await supabase
                .from('users')
                .insert(testUser)
                .select()

            if (insertError) {
                console.error('❌ Database setup needed. Please run these SQL commands in your Supabase SQL editor:')
                console.log(`
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

-- Activities table for real-time feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_ens ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_connection_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now, customize later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on connection_requests" ON connection_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all operations on activities" ON activities FOR ALL USING (true);
        `)
                return false
            } else {
                console.log('✅ Test user inserted successfully')
                // Delete the test user
                await supabase.from('users').delete().eq('wallet_address', testUser.wallet_address)
                return true
            }
        } else {
            console.log('✅ Database connection successful')
            return true
        }
    } catch (error) {
        console.error('❌ Database setup error:', error)
        return false
    }
}

setupDatabase().then((success) => {
    if (success) {
        console.log('🎉 Database ready for HackerRep!')
    } else {
        console.log('❌ Database setup incomplete')
    }
})