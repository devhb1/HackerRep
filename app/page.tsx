/**
 * HackerRep Homepage
 * 
 * Main landing page that displays:
 * - Platform statistics (users, connections, votes)
 * - ZK onboarding flow for new users (if ZK credentials missing)
 * - Activity feed showing real-time platform activity
 * - Auto-registration via AutoRegister component
 * 
 * Flow:
 * 1. User connects wallet → AutoRegister creates user profile
 * 2. Check for ZK credentials → Show ZKOnboarding if missing
 * 3. Display platform stats and activity feed
 */

'use client'

import Link from "next/link"
import { Logo } from "@/components/pixel/logo"
import { NFCHero } from "@/components/pixel/nfc-hero"
import { StatCard } from "@/components/pixel/stat-card"
import { ActivityFeed } from "@/components/pixel/activity-feed"
import { PixelButton } from "@/components/pixel/pixel-button"
import { AutoRegister } from "@/components/AutoRegister"
import { ZKOnboarding } from "@/components/ZKOnboarding"
// ...existing code...
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { isConnected, address } = useAccount()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeConnections: 0,
    votesToday: 0,
    totalActivities: 0
  })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [zkCredentials, setZkCredentials] = useState<any>(null)
  const [loadingCredentials, setLoadingCredentials] = useState(true)

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      checkZKCredentials()
    } else {
      setLoadingCredentials(false)
      setZkCredentials(null)
    }
  }, [isConnected, address])

  // Handle GitHub OAuth success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const githubConnected = urlParams.get('github_connected')
    const githubScore = urlParams.get('score')
    const githubUsername = urlParams.get('username')
    const githubError = urlParams.get('github_error')

    if (githubConnected === 'true' && githubUsername) {
      // Show connection success message (no score until zkPDF proof generated)
      const zkProofPending = urlParams.get('zkproof_pending')
      if (zkProofPending === 'true') {
        alert(`🔗 GitHub connected successfully!\n\n@${githubUsername} is now linked to your account.\n\n⚠️ No reputation points awarded yet - you need to generate zkPDF proofs for both academic and GitHub credentials.`)
      } else {
        alert(`🎉 GitHub connected successfully!\n\n@${githubUsername} is ready for zkPDF proof generation.`)
      }
      // Refresh credentials to show GitHub connection
      if (isConnected && address) {
        checkZKCredentials()
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (githubError) {
      const decodedError = decodeURIComponent(githubError)
      alert(`❌ GitHub connection failed: ${decodedError}\n\nPlease try again or contact support if the issue persists.`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [isConnected, address])

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

  const checkZKCredentials = async () => {
    if (!address) return

    setLoadingCredentials(true)
    try {
      const response = await fetch(`/api/zk-credentials/${address}`)
      if (response.ok) {
        const data = await response.json()
        setZkCredentials(data.credentials)

        // Show onboarding if user hasn't completed it or has low base score
        const needsOnboarding = !data.credentials.completed_onboarding ||
          data.credentials.total_base_score < 50
        setShowOnboarding(needsOnboarding)
      } else if (response.status === 404) {
        // User doesn't have ZK credentials yet - show onboarding
        setZkCredentials(null)
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Failed to check ZK credentials:', error)
      // On error, also show onboarding to help user get started
      setShowOnboarding(true)
    }
    setLoadingCredentials(false)
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

        {/* ZK ONBOARDING FLOW - Show when connected (temporarily always show for testing) */}
        {isConnected && !loadingCredentials && (
          <ZKOnboarding />
        )}

        {/* MOBILE ZK PROVER - Ethereum Foundation Track (REMOVED) */}
        {/* Removed MobileZKProver component to fix build error */}

        {/* MAIN HOMEPAGE - Show when not connected */}
        {!isConnected && !loadingCredentials && (
          <>
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
          </>
        )}

        {/* LOADING STATE */}
        {loadingCredentials && isConnected && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your ZK credentials...</p>
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Built with love at ETHGlobal • © {new Date().getFullYear()} HackerRep
        </div>
      </footer>
    </main>
  )
}
