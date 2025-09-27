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
            {/* Matrix background effect */}
            <div className="matrix-bg"></div>

            {/* ZK REPUTATION HERO SECTION */}
            <div className="relative text-center space-y-8 py-16">
              {/* Animated Logo */}
              <div className="flex justify-center mb-8">
                <Logo variant="hero" className="animate-float" />
              </div>

              <h1 className="font-pixel text-4xl md:text-6xl text-primary leading-tight animate-pulse-slow">
                PROVE YOUR SKILLS<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-green-400 animate-pulse">
                  WITHOUT REVEALING SECRETS
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Build verifiable reputation through <strong className="text-primary">zkPDF proofs</strong> of your credentials.
                Connect with fellow hackers and earn peer votes in our privacy-first reputation system.
              </p>

              <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-10">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <PixelButton
                      variant="accent"
                      onClick={openConnectModal}
                      className="text-lg px-10 py-5 animate-glow hover:scale-105 transition-transform duration-300 relative overflow-hidden zkproof-loading"
                    >
                      🚀 START BUILDING REP
                    </PixelButton>
                  )}
                </ConnectButton.Custom>
                <Link href="/leaderboard">
                  <PixelButton
                    variant="muted"
                    className="text-lg px-10 py-5 hover:scale-105 transition-transform duration-300 border-gradient"
                  >
                    🏆 VIEW LEADERBOARD
                  </PixelButton>
                </Link>
              </div>

              {/* Live stats ticker */}
              <div className="mt-12 p-4 pixel-border bg-card/50 backdrop-blur-sm rounded-lg max-w-2xl mx-auto">
                <div className="flex justify-center items-center gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <span className="text-muted-foreground">Live Network</span>
                  </div>
                  <div className="text-primary font-mono">
                    {stats.totalUsers.toLocaleString()} ZK Verified
                  </div>
                  <div className="text-accent font-mono">
                    {stats.votesToday} Votes Today
                  </div>
                </div>
              </div>
            </div>

            {/* ZK FEATURES SHOWCASE */}
            <div className="pixel-border bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-cyan-500/30 p-8 space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-green-500/10 animate-pulse"></div>
              <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>

              <h2 className="font-pixel text-3xl text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 bg-clip-text text-transparent relative z-10">
                ⚡ ZK-POWERED FEATURES ⚡
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="group text-center space-y-4 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-cyan-400/20 hover:border-cyan-400/60 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/20">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300 animate-bounce-slow filter drop-shadow-lg">🎓</div>
                  <h3 className="font-pixel text-lg text-cyan-400 group-hover:text-cyan-300 transition-colors font-bold">ACADEMIC PROOFS</h3>
                  <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors leading-relaxed">
                    Generate zkPDF proofs of degrees & certifications without revealing personal details
                  </p>
                  <div className="w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded opacity-50 group-hover:opacity-100 transition-opacity shadow-sm"></div>
                </div>

                <div className="group text-center space-y-4 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-blue-400/20 hover:border-blue-400/60 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/20">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300 animate-bounce-slow filter drop-shadow-lg" style={{ animationDelay: '0.5s' }}>⚡</div>
                  <h3 className="font-pixel text-lg text-blue-400 group-hover:text-blue-300 transition-colors font-bold">GITHUB VERIFICATION</h3>
                  <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors leading-relaxed">
                    Prove your coding skills through zero-knowledge GitHub repository proofs
                  </p>
                  <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-green-500 rounded opacity-50 group-hover:opacity-100 transition-opacity shadow-sm"></div>
                </div>

                <div className="group text-center space-y-4 p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-green-400/20 hover:border-green-400/60 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-400/20">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300 animate-bounce-slow filter drop-shadow-lg" style={{ animationDelay: '1s' }}>🗳️</div>
                  <h3 className="font-pixel text-lg text-green-400 group-hover:text-green-300 transition-colors font-bold">PEER VOTING</h3>
                  <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors leading-relaxed">
                    Earn upvotes & downvotes from fellow hackers to build social reputation layer
                  </p>
                  <div className="w-full h-1 bg-gradient-to-r from-green-400 to-cyan-500 rounded opacity-50 group-hover:opacity-100 transition-opacity shadow-sm"></div>
                </div>
              </div>
            </div>

            {/* PLATFORM STATS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="ZK Verified Hackers"
                value={`${stats.totalUsers.toLocaleString()} 🔐 BUILDERS`}
              />
              <StatCard
                label="Active Connections"
                value={`${stats.activeConnections} 🤝 CONNECTED`}
              />
              <StatCard
                label="Peer Votes Today"
                value={`${stats.votesToday.toLocaleString()} 🗳️ VOTES`}
              />
            </section>

            {/* HOW IT WORKS */}
            <div className="pixel-border bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-purple-400/30 p-8 space-y-8 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
              <h2 className="font-pixel text-3xl text-center bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent relative z-10">
                🔍 HOW IT WORKS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center relative z-10">
                <div className="group space-y-4 hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/40 rounded-xl flex items-center justify-center text-3xl hover:border-blue-400/80 transition-colors duration-300 shadow-lg hover:shadow-blue-400/20">
                    <span className="animate-pulse">1️⃣</span>
                  </div>
                  <h3 className="font-pixel text-base text-blue-400 group-hover:text-blue-300 transition-colors font-bold">CONNECT WALLET</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">Link your Ethereum wallet to get started</p>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                </div>

                <div className="group space-y-4 hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl flex items-center justify-center text-3xl hover:border-purple-400/80 transition-colors duration-300 shadow-lg hover:shadow-purple-400/20">
                    <span className="animate-bounce-slow">🎓</span>
                  </div>
                  <h3 className="font-pixel text-base text-purple-400 group-hover:text-purple-300 transition-colors font-bold">UPLOAD CREDENTIALS</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">Upload academic certs & connect GitHub</p>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                </div>

                <div className="group space-y-4 hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-xl flex items-center justify-center text-3xl hover:border-green-400/80 transition-colors duration-300 shadow-lg hover:shadow-green-400/20">
                    <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>🔒</span>
                  </div>
                  <h3 className="font-pixel text-base text-green-400 group-hover:text-green-300 transition-colors font-bold">GENERATE ZK PROOFS</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">Create zkPDF proofs to verify skills privately</p>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                </div>

                <div className="group space-y-4 hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/40 rounded-xl flex items-center justify-center text-3xl hover:border-yellow-400/80 transition-colors duration-300 shadow-lg hover:shadow-yellow-400/20">
                    <span className="animate-bounce-slow" style={{ animationDelay: '1s' }}>🏆</span>
                  </div>
                  <h3 className="font-pixel text-base text-yellow-400 group-hover:text-yellow-300 transition-colors font-bold">BUILD REPUTATION</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">Climb leaderboard & earn peer votes</p>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
                </div>
              </div>
            </div>

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
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground text-center space-y-2">
          <div className="flex justify-center items-center gap-2">
            <span>🔒 Privacy-First Reputation Protocol</span>
            <span>•</span>
            <span>⚡ Powered by zkPDF Technology</span>
          </div>
          <div>© {new Date().getFullYear()} HackerRep • Zero-Knowledge Verified</div>
        </div>
      </footer>
    </main>
  )
}
