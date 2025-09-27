export default function ScanPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <h1 className="font-pixel text-2xl text-primary glitch">SCANNING FOR WRISTBAND...</h1>
      <div className="pixel-border bg-card p-8 glow grid gap-6">
        <div className="flex items-center justify-center">
          <div className="rounded-full size-56 bg-muted animate-[pulse-ring_2s_infinite] flex items-center justify-center pixel-border">
            <img src="/pixel-nfc-symbol.jpg" alt="NFC Symbol" className="size-20" />
          </div>
        </div>
        <div className="w-full h-3 bg-muted pixel-border">
          <div className="h-full bg-primary animate-[progress_2.4s_ease-in-out_infinite]" style={{ width: "40%" }} />
        </div>
        <p className="text-sm text-muted-foreground">
          Hold your wristband near the phone. If it fails, try Manual Mode below.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/scan?mode=manual" className="font-pixel bg-muted text-foreground px-4 py-2 pixel-border">
            Manual Mode
          </a>
          <a href="/leaderboard" className="font-pixel bg-accent text-accent-foreground px-4 py-2 pixel-border">
            Skip to Browse
          </a>
        </div>
      </div>
    </main>
  )
}
