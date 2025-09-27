export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="flex items-center gap-4">
        <img src="/pixel-avatar.png" alt="Avatar" className="size-18 rounded bg-muted pixel-border" />
        <div>
          <h1 className="font-pixel text-2xl text-primary">alice.eth</h1>
          <div className="text-sm text-muted-foreground">
            Reputation: <span className="font-pixel text-accent">408</span>
          </div>
        </div>
      </header>
      <section className="grid md:grid-cols-3 gap-4">
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Upvotes</div>
          <div className="font-pixel text-primary text-xl">420</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Downvotes</div>
          <div className="font-pixel text-primary text-xl">12</div>
        </div>
        <div className="pixel-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Conversations</div>
          <div className="font-pixel text-primary text-xl">77</div>
        </div>
      </section>
      <section className="pixel-border bg-card p-4">
        <h2 className="font-pixel text-primary mb-3">Recent Activity</h2>
        <ul className="text-sm space-y-2">
          <li>Chatted with anon-39 • +1 rep</li>
          <li>Received badge: Highly Rated</li>
          <li>Upvoted bob.eth</li>
        </ul>
      </section>
    </main>
  )
}
