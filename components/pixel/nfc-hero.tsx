"use client"

import { PixelButton } from "./pixel-button"
import Link from "next/link"

export function NFCHero() {
  return (
    <section className="relative pixel-border bg-card p-6 md:p-10 glow overflow-hidden">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
        <div className="flex flex-col gap-4">
          <h1 className="font-pixel text-2xl md:text-4xl text-primary glitch">TAP WRISTBAND TO START</h1>
          <p className="text-muted-foreground leading-relaxed">
            Meet • Chat • Vote • Climb the leaderboard. Connect with builders and grow your reputation.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/scan">
              <PixelButton className="animate-[pulse-ring_2s_infinite]" variant="primary">
                Start Scanning
              </PixelButton>
            </Link>
            <Link href="/leaderboard">
              <PixelButton variant="accent">View Leaderboard</PixelButton>
            </Link>
          </div>
          <div className="mt-2 text-xs text-primary">Status: Ready to scan</div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="rounded-full size-40 md:size-56 bg-muted flex items-center justify-center animate-[pulse-ring_2s_infinite] pixel-border">
            <img src="/pixel-nfc-icon.jpg" alt="Pixel NFC icon" className="size-24" />
          </div>
        </div>
      </div>
    </section>
  )
}
