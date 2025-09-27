
-- Main schema for HackerRep reputation system
-- Each table and index is explained below for clarity


-- USERS: Stores all registered users with wallet, ENS, display, avatar, and reputation
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique user ID
  wallet_address TEXT UNIQUE NOT NULL,           -- Wallet address (unique)
  ens_name TEXT UNIQUE,                         -- ENS name (if available)
  display_name TEXT NOT NULL,                   -- Display name (ENS or formatted wallet)
  avatar_url TEXT,                              -- Avatar image URL
  reputation INTEGER DEFAULT 100,               -- Starting reputation
  total_upvotes INTEGER DEFAULT 0,              -- Upvotes received
  total_downvotes INTEGER DEFAULT 0,            -- Downvotes received
  total_connections INTEGER DEFAULT 0,          -- Connections made
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Creation timestamp
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Last update timestamp
);


-- CONNECTION_REQUESTS: Tracks connection requests between users
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique request ID
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Who sent request
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,    -- Who receives request
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending', -- Request status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),        -- Creation timestamp
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'), -- Expiry
  accepted_at TIMESTAMP WITH TIME ZONE,                     -- When accepted
  UNIQUE(requester_id, target_id)                           -- Prevent duplicate requests
);


-- VOTES: Stores upvotes/downvotes for reputation
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique vote ID
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,      -- Who voted
  voted_for_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Who was voted for
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL, -- Upvote or downvote
  connection_request_id UUID REFERENCES connection_requests(id) ON DELETE CASCADE, -- Related connection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),         -- When vote was cast
  UNIQUE(voter_id, voted_for_id)                            -- Prevent duplicate votes
);


-- ACTIVITIES: Real-time feed of user actions (join, vote, connect, etc)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique activity ID
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Who performed activity
  activity_type TEXT NOT NULL,                        -- Type of activity
  description TEXT NOT NULL,                          -- Description for feed
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Target user (if any)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()   -- When activity occurred
);


-- INDEXES: For fast queries and leaderboard
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_ens ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation DESC);
CREATE INDEX IF NOT EXISTS idx_connection_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_target ON connection_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted_for ON votes(voted_for_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);


-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;


-- RLS Policies: Allow all for dev, restrict for prod
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on connection_requests" ON connection_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations on votes" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all operations on activities" ON activities FOR ALL USING (true);


-- SAMPLE DATA: Uncomment for quick testing
-- INSERT INTO users (wallet_address, ens_name, display_name, avatar_url, reputation, total_upvotes, total_downvotes, total_connections)
-- VALUES 
--   ('0x1234567890abcdef1234567890abcdef12345678', 'alice.eth', 'alice.eth', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alice.eth', 150, 10, 2, 5),
--   ('0xabcdef1234567890abcdef1234567890abcdef12', 'bob.eth', 'bob.eth', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=bob.eth', 120, 5, 1, 3),
--   ('0x9876543210fedcba9876543210fedcba98765432', 'charlie.eth', 'charlie.eth', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=charlie.eth', 90, 2, 3, 2)
-- ON CONFLICT (wallet_address) DO NOTHING;


-- SAMPLE ACTIVITIES: Uncomment for quick testing
-- INSERT INTO activities (user_id, activity_type, description)
-- SELECT 
--   u.id, 
--   'user_joined', 
--   'New hacker joined: ' || u.display_name
-- FROM users u
-- WHERE u.ens_name IN ('alice.eth', 'bob.eth', 'charlie.eth');


-- SAMPLE VOTES/CONNECTIONS: Uncomment for quick testing
-- INSERT INTO activities (user_id, activity_type, description, target_user_id)
-- SELECT 
--   u1.id,
--   'vote_cast',
--   u1.display_name || ' upvoted ' || u2.display_name,
--   u2.id
-- FROM users u1, users u2
-- WHERE u1.ens_name = 'alice.eth' AND u2.ens_name = 'bob.eth'
-- UNION ALL
-- SELECT 
--   u1.id,
--   'connection_made',
--   u1.display_name || ' connected with ' || u2.display_name,
--   u2.id
-- FROM users u1, users u2
-- WHERE u1.ens_name = 'bob.eth' AND u2.ens_name = 'charlie.eth';