'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export default function ProfilePage() {
  const { address } = useAccount()
  const [user, setUser] = useState<any>(null)
  const [votes, setVotes] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    async function fetchProfile() {
      setLoading(true)
      const res = await fetch(`/api/users/search?q=${address}`)
      const data = await res.json()
      setUser(data.users?.[0] || null)
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

  if (!address) return <div className="p-8">Connect your wallet to view your profile.</div>
  if (loading) return <div className="p-8">Loading profile...</div>
  if (!user) return <div className="p-8">User not found.</div>

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="flex items-center gap-4">
        <img src={user.avatar_url || '/pixel-avatar.png'} alt="Avatar" className="size-18 rounded bg-muted pixel-border" />
        <div>
          <h1 className="font-pixel text-2xl text-primary">{user.ens_name || user.display_name || user.wallet_address}</h1>
          <div className="text-sm text-muted-foreground">
            Reputation: <span className="font-pixel text-accent">{user.reputation}</span>
          </div>
        </div>
      </header>
      <section className="grid md:grid-cols-3 gap-4">
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Upvotes</div>
          <div className="font-pixel text-primary text-xl">{user.total_upvotes}</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Downvotes</div>
          <div className="font-pixel text-primary text-xl">{user.total_downvotes}</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Connections</div>
          <div className="font-pixel text-primary text-xl">{user.total_connections}</div>
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
