'use client'

import { useEffect, useState } from 'react'

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      const res = await fetch('/api/leaderboard')
      const data = await res.json()
      setRows(data.leaderboard || [])
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="font-pixel text-2xl text-primary glitch">🏆 HACKER LEADERBOARD</h1>
      <div className="pixel-border bg-card p-4 overflow-hidden">
        <div className="overflow-x-auto">
          {loading && <div className="text-muted-foreground">Loading...</div>}
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-4">Rank</th>
                <th className="py-2 pr-4">ENS</th>
                <th className="py-2 pr-4 text-green-300">Up</th>
                <th className="py-2 pr-4 text-red-300">Down</th>
                <th className="py-2 pr-4">Net</th>
                <th className="py-2 pr-4">Conversations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || i} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-pixel text-primary">#{i + 1}</td>
                  <td className="py-2 pr-4">{r.ens_name || r.display_name || r.wallet_address}</td>
                  <td className="py-2 pr-4 text-green-300">{r.total_upvotes}</td>
                  <td className="py-2 pr-4 text-red-300">{r.total_downvotes}</td>
                  <td className="py-2 pr-4">{r.reputation}</td>
                  <td className="py-2 pr-4">{r.total_connections}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
