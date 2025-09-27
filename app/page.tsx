'use client'

import Link from "next/link"
import { Logo } from "@/components/pixel/logo"
import { NFCHero } from "@/components/pixel/nfc-hero"
import { StatCard } from "@/components/pixel/stat-card"
import { ActivityFeed } from "@/components/pixel/activity-feed"
import { PixelButton } from "@/components/pixel/pixel-button"
import { AutoRegister } from "@/components/AutoRegister"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { isConnected } = useAccount()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeConnections: 0,
    votesToday: 0,
    totalActivities: 0
  })

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link className="hover:underline" href="/search">
              Search
            </Link>
            <Link className="hover:underline" href="/scan">
              Scan
            </Link>
            <Link className="hover:underline" href="/chat">
              Chat
            </Link>
            <Link className="hover:underline" href="/vote">
              Vote
            </Link>
            <Link className="hover:underline" href="/leaderboard">
              Leaderboard
            </Link>
            <Link className="hover:underline" href="/profile">
              Profile
            </Link>
          </nav>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading'
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated')

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <PixelButton variant="accent" onClick={openConnectModal}>
                          Connect Wallet
                        </PixelButton>
                      )
                    }

                    if (chain.unsupported) {
                      return (
                        <PixelButton variant="accent" onClick={openChainModal}>
                          Wrong network
                        </PixelButton>
                      )
                    }

                    return (
                      <div className="flex gap-2">
                        <PixelButton
                          variant="muted"
                          onClick={openAccountModal}
                          className="text-xs"
                        >
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ''}
                        </PixelButton>
                      </div>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-8">
        {/* AUTO-REGISTRATION FOR CONNECTED USERS */}
        {isConnected && <AutoRegister />}

        <NFCHero />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Hackers"
            value={`${stats.totalUsers.toLocaleString()} BUILDERS`}
          />
          <StatCard
            label="Active Connections"
            value={`${stats.activeConnections} CONNECTED`}
          />
          <StatCard
            label="Votes Today"
            value={`${stats.votesToday.toLocaleString()} VOTES`}
          />
        </section>

        <ActivityFeed />
      </div>

      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Built with love at ETHGlobal • © {new Date().getFullYear()} HackerRep
        </div>
      </footer>
    </main>
  )
}
