'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { PixelButton } from '@/components/pixel/pixel-button'
import { User } from '@/lib/supabase'

export default function SearchPage() {
    const { address } = useAccount()
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const searchUsers = async () => {
        if (!searchTerm.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`)
            const data = await response.json()
            setSearchResults(data.users || [])
        } catch (error) {
            console.error('Search error:', error)
        }
        setIsLoading(false)
    }

    const sendConnectionRequest = async (targetWallet: string) => {
        try {
            const response = await fetch('/api/connections/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterWallet: address,
                    targetWallet
                })
            })

            if (response.ok) {
                alert('🚀 Connection request sent!')
            } else {
                const error = await response.json()
                alert(`❌ ${error.error}`)
            }
        } catch (error) {
            alert('❌ Failed to send request')
        }
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
            <h1 className="font-pixel text-2xl text-primary glitch">FIND HACKERS</h1>

            <div className="pixel-border bg-card p-6">
                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Search ENS name or wallet address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 pixel-border bg-background px-4 py-3 text-foreground"
                        onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    />
                    <PixelButton
                        onClick={searchUsers}
                        disabled={isLoading}
                        variant="primary"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </PixelButton>
                </div>

                <div className="space-y-3">
                    {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between pixel-border bg-muted p-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full pixel-border bg-muted flex items-center justify-center overflow-hidden">
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
                                onClick={() => sendConnectionRequest(user.wallet_address)}
                                variant="accent"
                                className="text-sm"
                            >
                                Connect
                            </PixelButton>
                        </div>
                    ))}
                </div>

                {searchResults.length === 0 && searchTerm && !isLoading && (
                    <div className="text-center text-muted-foreground py-8">
                        No users found for "{searchTerm}"
                    </div>
                )}
            </div>
        </main>
    )
}