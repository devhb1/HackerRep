'use client'

import { useAccount } from 'wagmi'
import { useENSProfile } from '@/hooks/useENS'
import { useEffect, useState } from 'react'
import { User } from '@/lib/supabase'
import { PixelButton } from './pixel/pixel-button'

export function AutoRegister() {
    const { address, isConnected } = useAccount()
    const { ensName, displayName, avatar, isLoading: ensLoading } = useENSProfile(address)
    const [user, setUser] = useState<User | null>(null)
    const [isRegistering, setIsRegistering] = useState(false)

    useEffect(() => {
        if (!isConnected || !address) return

        // Wait a bit for ENS resolution before registering
        const timer = setTimeout(() => {
            registerOrUpdateUser()
        }, 2000) // 2 second delay to allow ENS resolution

        return () => clearTimeout(timer)
    }, [address, isConnected])

    // Re-register when ENS name changes
    useEffect(() => {
        if (!isConnected || !address || !user) return
        if (ensName && ensName !== user.ens_name) {
            registerOrUpdateUser()
        }
    }, [ensName])

    const registerOrUpdateUser = async () => {
        if (isRegistering) return
        setIsRegistering(true)

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    ensName,
                    displayName,
                    avatarUrl: avatar
                })
            })

            const data = await response.json()
            setUser(data.user)

            if (data.isNew) {
                console.log('🎉 Welcome to HackerRep! Starting with 100 reputation.')
            }
        } catch (error) {
            console.error('Registration error:', error)
        }
        setIsRegistering(false)
    }

    const refreshENS = () => {
        registerOrUpdateUser()
    }

    if (!isConnected) return null

    return (
        <div className="pixel-border bg-card p-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="size-12 rounded-full pixel-border bg-muted flex items-center justify-center overflow-hidden">
                    {(avatar || user?.avatar_url) ? (
                        <img
                            src={user?.avatar_url || avatar || ''}
                            alt="Profile"
                            className="size-12 rounded-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    ) : null}
                    <div
                        className="size-12 rounded-full bg-accent flex items-center justify-center text-lg font-pixel"
                        style={{ display: (avatar || user?.avatar_url) ? 'none' : 'flex' }}
                    >
                        {(user?.display_name || displayName)?.[0]?.toUpperCase() || '?'}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="font-pixel text-primary text-lg">
                        {user?.display_name || (ensName || displayName)}
                        {ensLoading && !ensName && (
                            <span className="ml-2 text-xs text-muted-foreground">resolving ENS...</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Reputation: <span className="text-accent">{user?.reputation || 100}</span>
                        {(user?.ens_name || ensName) && (
                            <span className="ml-2 text-green-400">✓ ENS</span>
                        )}
                    </div>
                </div>
                <PixelButton
                    variant="muted"
                    onClick={refreshENS}
                    disabled={isRegistering}
                    className="text-xs"
                >
                    {isRegistering ? 'Updating...' : 'Refresh ENS'}
                </PixelButton>
            </div>
        </div>
    )
}