'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { address } = useAccount()
  const [user, setUser] = useState<any>(null)
  const [zkCredentials, setZkCredentials] = useState<any>(null)
  const [votes, setVotes] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    async function fetchProfile() {
      setLoading(true)

      // Fetch basic user data
      const res = await fetch(`/api/users/search?q=${address}`)
      const data = await res.json()
      setUser(data.users?.[0] || null)

      // Fetch zkPDF credentials
      const zkRes = await fetch(`/api/zk-credentials/${address}`)
      if (zkRes.ok) {
        const zkData = await zkRes.json()
        setZkCredentials(zkData.credentials)
      }

      // Fetch votes
      const vres = await fetch(`/api/votes?user=${address}`)
      const vdata = await vres.json()
      setVotes(vdata.votes || [])

      // Fetch recent activities
      const ares = await fetch(`/api/activities?user=${address}&limit=10`)
      const adata = await ares.json()
      setActivities(adata.activities || [])

      setLoading(false)
    }
    fetchProfile()
  }, [address])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'blockchain-expert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'senior-dev': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'developer': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'student': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  if (!address) return <div className="p-8">Connect your wallet to view your profile.</div>
  if (loading) return <div className="p-8">Loading profile...</div>
  if (!user) return <div className="p-8">User not found.</div>

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="flex items-center gap-4">
        <img src={user?.avatar_url || '/pixel-avatar.png'} alt="Avatar" className="size-18 rounded bg-muted pixel-border" />
        <div className="flex-1">
          <h1 className="font-pixel text-2xl text-primary">
            {user?.ens_name || user?.display_name || `${address?.substring(0, 6)}...${address?.substring(-4)}`}
          </h1>
          <div className="text-sm text-muted-foreground font-mono">
            {`${address?.substring(0, 6)}...${address?.substring(-4)}`}
          </div>
          {zkCredentials && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getTierColor(zkCredentials.reputation_tier)}>
                {zkCredentials.reputation_tier.replace('-', ' ').toUpperCase()}
              </Badge>
              {zkCredentials.completed_onboarding && (
                <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                  ✅ zkPDF Verified
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      {/* zkPDF Reputation Section */}
      {zkCredentials && (
        <section className="pixel-border bg-card p-6">
          <h2 className="font-pixel text-primary mb-4 flex items-center gap-2">
            🔐 zkPDF Reputation
            <span className="text-xs text-muted-foreground">(ZK Proof Verified)</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="font-pixel text-2xl text-primary">{zkCredentials.total_base_score}</div>
              <div className="text-xs text-muted-foreground">Total zkPDF Score</div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xl text-blue-400">{zkCredentials.education_score}</div>
              <div className="text-xs text-muted-foreground">Education</div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xl text-green-400">{zkCredentials.github_score}</div>
              <div className="text-xs text-muted-foreground">GitHub</div>
            </div>
            <div className="text-center">
              <div className="font-pixel text-xl text-purple-400">{zkCredentials.social_score}</div>
              <div className="text-xs text-muted-foreground">Social (Phase 2)</div>
            </div>
          </div>

          {zkCredentials.completed_onboarding && (
            <div className="text-xs text-muted-foreground text-center p-3 bg-green-500/10 border border-green-500/20 rounded">
              ✅ Your reputation is verified through zero-knowledge proofs using official zkPDF circuits
            </div>
          )}
        </section>
      )}

      {/* Legacy Reputation (for users without zkPDF) */}
      {user && !zkCredentials?.completed_onboarding && (
        <section className="grid md:grid-cols-3 gap-4">
          <div className="pixel-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Legacy Reputation</div>
            <div className="font-pixel text-primary text-xl">{user.reputation}</div>
            <div className="text-xs text-yellow-400">⚠️ Not zkPDF verified</div>
          </div>
          <div className="pixel-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Upvotes</div>
            <div className="font-pixel text-primary text-xl">{user.total_upvotes}</div>
          </div>
          <div className="pixel-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Connections</div>
            <div className="font-pixel text-primary text-xl">{user.total_connections}</div>
          </div>
        </section>
      )}

      {/* Phase 2 Social Features */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">7d Upvotes</div>
          <div className="font-pixel text-green-400 text-xl">0</div>
          <div className="text-xs text-muted-foreground">Phase 2: Self Protocol</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">7d Downvotes</div>
          <div className="font-pixel text-red-400 text-xl">0</div>
          <div className="text-xs text-muted-foreground">Phase 2: Self Protocol</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Current Rep</div>
          <div className="font-pixel text-primary text-xl">{zkCredentials?.total_base_score || user?.reputation || 0}</div>
          <div className="text-xs text-muted-foreground">Starting = zkPDF Score</div>
        </div>
      </section>
      <section className="pixel-border bg-card p-4">
        <h2 className="font-pixel text-primary mb-3">Recent Activity</h2>
        <ul className="text-sm space-y-2">
          {activities.map((a: any, i: number) => (
            <li key={i}>{a.description}</li>
          ))}
        </ul>
      </section>
      <section className="pixel-border bg-card p-4">
        <h2 className="font-pixel text-primary mb-3">Your Votes</h2>
        <ul className="text-sm space-y-2">
          {votes.map((v: any, i: number) => (
            <li key={i}>{v.vote_type === 'upvote' ? 'Upvoted' : 'Downvoted'} {v.voted_for_ens || v.voted_for_display || v.voted_for_wallet}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
