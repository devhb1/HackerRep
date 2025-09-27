"use client"

import { cn } from "@/lib/utils"

const sample = [
  { id: 1, text: "alice.eth upvoted bob.eth", time: "2m" },
  { id: 2, text: "New hacker joined: charlie.eth", time: "5m" },
  { id: 3, text: "dora.eth started a chat", time: "12m" },
  { id: 4, text: "eve.eth downvoted frank.eth", time: "14m" },
  { id: 5, text: 'grace.eth earned badge "Highly Rated"', time: "20m" },
]

export function ActivityFeed({ className }: { className?: string }) {
  return (
    <div className={cn("pixel-border bg-card p-4 md:p-6 overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-primary text-base">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Auto-updating</span>
      </div>
      <div className="mt-4 h-40 md:h-48 overflow-y-auto scanlines pr-2">
        <ul className="space-y-3">
          {sample.map((item) => (
            <li key={item.id} className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-3">
                <img src="/pixel-avatar.png" alt="" className="size-7 rounded bg-muted" />
                <span className="text-sm">{item.text}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
