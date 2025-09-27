import Link from "next/link"
import { Logo } from "@/components/pixel/logo"
import { NFCHero } from "@/components/pixel/nfc-hero"
import { StatCard } from "@/components/pixel/stat-card"
import { ActivityFeed } from "@/components/pixel/activity-feed"
import { PixelButton } from "@/components/pixel/pixel-button"

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-4 text-sm">
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
          <PixelButton variant="accent">Connect Wallet</PixelButton>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-8">
        <NFCHero />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Hackers" value="1,337 BUILDERS" />
          <StatCard label="Active Conversations" value="42 CHATTING NOW" />
          <StatCard label="Votes Today" value="2,048 VOTES" />
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
