'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface LeaderboardUser {
  rank: number
  wallet_address: string
  display_name: string
  zkpdf_reputation: number
  education_score: number
  github_score: number
  social_score: number
  reputation_tier: string
  total_upvotes: number
  total_downvotes: number
  current_reputation: number
  zkpdf_verified: boolean
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setRows(data.leaderboard || [])
        setTotalUsers(data.total_verified_users || 0)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      }
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'blockchain-expert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'senior-dev': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'developer': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'student': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-pixel text-3xl text-primary glitch">🏆 zkPDF REPUTATION LEADERBOARD</h1>
        <p className="text-muted-foreground">
          Ethereum Foundation Hackathon • Only users with zkPDF-verified credentials
        </p>
        <div className="text-sm text-accent">
          {totalUsers} verified users with zero-knowledge proofs
        </div>
      </div>

      <div className="pixel-border bg-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          {loading && <div className="text-muted-foreground text-center py-8">Loading zkPDF verified users...</div>}

          {!loading && rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg mb-2">🔍 No zkPDF verified users yet</div>
              <div className="text-sm">Be the first to generate zkPDF reputation proofs!</div>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 pr-4">Rank</th>
                  <th className="py-3 pr-4">Wallet</th>
                  <th className="py-3 pr-4">zkPDF Reputation</th>
                  <th className="py-3 pr-4">Education</th>
                  <th className="py-3 pr-4">GitHub</th>
                  <th className="py-3 pr-4">7d Upvotes</th>
                  <th className="py-3 pr-4">7d Downvotes</th>
                  <th className="py-3 pr-4">Current Rep</th>
                  <th className="py-3 pr-4">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.wallet_address} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-primary">#{user.rank}</span>
                        {user.rank <= 3 && (
                          <span>{user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {user.display_name}
                      <div className="text-xs text-muted-foreground">
                        ✅ zkPDF Verified
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-primary">{user.zkpdf_reputation}</span>
                      <span className="text-muted-foreground text-xs"> pts</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {user.education_score > 0 ? (
                        <span className="text-blue-400">{user.education_score}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {user.github_score > 0 ? (
                        <span className="text-green-400">{user.github_score}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center text-green-300">
                      {user.total_upvotes}
                      <div className="text-xs text-muted-foreground">Phase 2</div>
                    </td>
                    <td className="py-3 pr-4 text-center text-red-300">
                      {user.total_downvotes}
                      <div className="text-xs text-muted-foreground">Phase 2</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{user.current_reputation}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={`text-xs ${getTierColor(user.reputation_tier)}`}>
                        {user.reputation_tier.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            🔐 All reputations verified through zkPDF zero-knowledge proofs •
            Phase 2: Social reputation layer with Self Protocol integration
          </div>
        )}
      </div>
    </main>
  )
}
