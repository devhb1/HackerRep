export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="font-pixel text-2xl text-primary">Settings</h1>
      <form className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm">ENS Name</label>
          <input className="pixel-border bg-card px-3 py-2" placeholder="alice.eth" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Bio</label>
          <textarea className="pixel-border bg-card p-3" placeholder="Tell others what you build..." maxLength={280} />
        </div>
        <div className="flex items-center gap-2">
          <input id="notif" type="checkbox" className="accent-primary" />
          <label htmlFor="notif" className="text-sm">
            Enable vote notifications
          </label>
        </div>
        <button className="font-pixel pixel-border bg-accent text-accent-foreground px-6 py-3 w-fit">Save</button>
      </form>
    </main>
  )
}
