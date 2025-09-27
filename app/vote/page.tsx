'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { PixelButton } from '@/components/pixel/pixel-button'
import { User } from '@/lib/supabase'

export default function VotePage() {
  const { address } = useAccount()
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch connected users
  useEffect(() => {
    async function fetchConnectedUsers() {
      if (!address) return
      try {
        const response = await fetch('/api/connections/connected', {
          headers: { 'x-wallet': address }
        })
        const data = await response.json()
        setConnectedUsers(data.users || [])
      } catch (error) {
        console.error('Failed to fetch connected users:', error)
      }
    }
    fetchConnectedUsers()
  }, [address])

  const submitVote = async (voteType: 'upvote' | 'downvote') => {
    if (!selectedUser || !address) return

    setLoading(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterWallet: address,
          votedForWallet: selectedUser.wallet_address,
          voteType,
          feedback: feedback.trim() || null
        })
      })

      if (response.ok) {
        alert(`✅ ${voteType === 'upvote' ? '+1' : '-1'} vote submitted!`)
        setSelectedUser(null)
        setFeedback('')
        // Refresh connected users
        const refreshResponse = await fetch('/api/connections/connected', {
          headers: { 'x-wallet': address }
        })
        const data = await refreshResponse.json()
        setConnectedUsers(data.users || [])
      } else {
        const error = await response.json()
        alert(`❌ ${error.error}`)
      }
    } catch (error) {
      alert('❌ Failed to submit vote')
    }
    setLoading(false)
  }

  if (!selectedUser) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <h1 className="font-pixel text-2xl text-primary glitch">VOTE ON CONNECTIONS</h1>

        <div className="pixel-border bg-card p-6">
          <h2 className="font-pixel text-lg mb-4">Select a connected user to vote on:</h2>

          {connectedUsers.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No connected users to vote on. Connect with people first!
            </div>
          ) : (
            <div className="space-y-3">
              {connectedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between pixel-border bg-muted p-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full pixel-border bg-accent flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="size-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-12 rounded-full bg-accent flex items-center justify-center text-lg font-pixel">
                          {user.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-pixel text-foreground">
                        {user.display_name}
                        {user.ens_name && <span className="ml-2 text-green-400 text-xs">✓ ENS</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rep: {user.reputation} • Connections: {user.total_connections}
                      </div>
                      {user.ens_name && (
                        <div className="text-xs text-accent">{user.ens_name}</div>
                      )}
                    </div>
                  </div>

                  <PixelButton
                    onClick={() => setSelectedUser(user)}
                    variant="accent"
                    className="text-sm"
                  >
                    Vote
                  </PixelButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="font-pixel text-2xl text-primary glitch">RATE THIS HACKER</h1>

      <section className="pixel-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full pixel-border bg-accent flex items-center justify-center overflow-hidden">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt=""
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-accent flex items-center justify-center text-xl font-pixel">
                {selectedUser.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="font-pixel text-lg text-foreground">
              {selectedUser.display_name}
              {selectedUser.ens_name && <span className="ml-2 text-green-400 text-sm">✓ ENS</span>}
            </div>
            <div className="text-sm text-muted-foreground">
              Current Rep: {selectedUser.reputation}
            </div>
            {selectedUser.ens_name && (
              <div className="text-xs text-accent">{selectedUser.ens_name}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PixelButton
            onClick={() => submitVote('upvote')}
            disabled={loading}
            variant="primary"
            className="p-4"
          >
            +1 REP
          </PixelButton>
          <PixelButton
            onClick={() => setSelectedUser(null)}
            disabled={loading}
            variant="muted"
            className="p-4"
          >
            SKIP
          </PixelButton>
          <PixelButton
            onClick={() => submitVote('downvote')}
            disabled={loading}
            variant="accent"
            className="p-4 bg-red-600 hover:bg-red-700"
          >
            -1 REP
          </PixelButton>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Anonymous feedback (optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full h-24 pixel-border bg-background p-3 text-foreground"
            maxLength={200}
            placeholder="Great insights about DeFi scaling..."
          />
          <div className="text-xs text-muted-foreground">{feedback.length}/200 chars</div>
        </div>
      </section>
    </main>
  )
}
