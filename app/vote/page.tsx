export default function VotePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="font-pixel text-2xl text-primary glitch">RATE THIS HACKER</h1>
      <section className="pixel-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <img src="/pixel-avatar.png" alt="Anonymous avatar" className="size-14 rounded bg-muted" />
          <div className="text-sm text-muted-foreground">Conversation completed!</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="font-pixel pixel-border bg-primary text-primary-foreground p-4">+1 REP</button>
          <button className="font-pixel pixel-border bg-muted text-foreground p-4">SKIP</button>
          <button className="font-pixel pixel-border bg-destructive text-destructive-foreground p-4">-1 REP</button>
        </div>
        <div className="space-y-2">
          <label className="text-sm">Anonymous feedback (optional)</label>
          <textarea
            className="w-full h-24 pixel-border bg-card p-3"
            maxLength={200}
            placeholder="Great insights about DeFi scaling..."
          />
          <div className="text-xs text-muted-foreground">200 chars max</div>
        </div>
        <button className="font-pixel pixel-border bg-accent text-accent-foreground px-6 py-3">SUBMIT VOTE</button>
      </section>
    </main>
  )
}
