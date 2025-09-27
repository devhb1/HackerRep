export default function LeaderboardPage() {
  const rows = [
    { rank: 1, name: "alice.eth", up: 420, down: 12, net: 408, conv: 77 },
    { rank: 2, name: "bob.eth", up: 400, down: 20, net: 380, conv: 64 },
    { rank: 3, name: "charlie.eth", up: 350, down: 10, net: 340, conv: 58 },
    { rank: 4, name: "dora.eth", up: 320, down: 30, net: 290, conv: 61 },
  ]
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="font-pixel text-2xl text-primary glitch">🏆 HACKER LEADERBOARD</h1>
      <div className="pixel-border bg-card p-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-4">Rank</th>
                <th className="py-2 pr-4">ENS</th>
                <th className="py-2 pr-4 text-green-300">Up</th>
                <th className="py-2 pr-4 text-red-300">Down</th>
                <th className="py-2 pr-4">Net</th>
                <th className="py-2 pr-4">Conversations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-pixel text-primary">#{r.rank}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4 text-green-300">{r.up}</td>
                  <td className="py-2 pr-4 text-red-300">{r.down}</td>
                  <td className="py-2 pr-4">{r.net}</td>
                  <td className="py-2 pr-4">{r.conv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
