HackerRep - Decentralized Reputation System

## Overview

HackerRep is a decentralized reputation system for hackers and developers, built on Web3. Users connect their wallet, fetch their ENS name (or use a wallet fallback), and build reputation through verified in-person connections and voting.

## User Flow

1. **User visits platform**
2. **Connects wallet** (RainbowKit)
3. **ENS name fetched** (if available, else wallet fallback)
4. **Auto-registers in Supabase DB**
5. **User can search for other hackers by ENS name, display name, or wallet address**
6. **Send connection request** (verifies physical interaction)
7. **Target user sees pending request, can accept/reject**
8. **Once accepted, connection is established**
9. **Users can upvote (+5) or downvote (-3) each other based on interaction**
10. **Leaderboard and activity feed update in real time**

## Connection Verification Options

- **ENS-based search and verify** (default, most used)
- **zkProof** (future, advanced privacy)
- **Worldcoin/3Box API** (optional, easier but less secure)
- **NFC wristband (ETHGlobal event)** (most secure, limited to event attendees)

## Project Structure

- **Next.js 14 + TypeScript + Tailwind CSS** (pixel cyberpunk theme)
- **RainbowKit + wagmi + viem** (wallet/ENS integration)
- **Supabase PostgreSQL** (users, activities, connection_requests, votes)
- **Custom pixel UI components**

## What We Did In Each Phase (Commit History)

### Phase 1: Project Setup
- Next.js app initialized
- Tailwind CSS and pixel theme configured
- Supabase DB schema created

### Phase 2: Wallet & ENS Integration, Database & API Layer
- RainbowKit wallet connect added
- ENS resolution logic (fallback to wallet)
- Auto-register user on connect
- User registration API
- Supabase client setup
- Activities, connections, votes API endpoints
- Search page for finding hackers
- Connection request workflow (send)


## Key Files

- `/app/api/users/register/route.ts` - User registration logic
- `/app/api/activities/route.ts` - Activity feed API
- `/app/api/connections/request/route.ts` - Connection request API
- `/app/api/users/search/route.ts` - User search API
- `/app/api/stats/route.ts` - Platform stats API
- `/components/AutoRegister.tsx` - ENS onboarding logic
- `/app/search/page.tsx` - Search and connect UI
- `/lib/supabase.ts` - Supabase client/types
- `/supabase-schema.sql` - DB schema

---
For questions, open an issue or DM @devhb1
 