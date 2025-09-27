"use client"

import { useState } from "react"

export default function ChatPage() {
  const [msg, setMsg] = useState("")
  const [messages, setMessages] = useState<{ from: "me" | "them"; text: string }[]>([
    { from: "them", text: "Hey anon! Favorite Web3 tool?" },
    { from: "me", text: "Loving wagmi + viem lately." },
  ])

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <header className="flex items-center justify-between pixel-border bg-card p-3">
        <h1 className="font-pixel text-primary">ANONYMOUS CHAT</h1>
        <div className="text-xs text-accent font-mono">08:32 REMAINING</div>
      </header>

      <section className="pixel-border bg-card p-4 space-y-3 h-[60dvh] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] ${m.from === "me" ? "ml-auto" : ""}`}>
            <div className={`pixel-border p-3 ${m.from === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-1 items-center text-primary">
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
        </div>
      </section>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!msg.trim()) return
          setMessages((prev) => [...prev, { from: "me", text: msg }])
          setMsg("")
        }}
      >
        <input
          className="flex-1 pixel-border bg-card px-3 py-2 focus-visible-ring"
          placeholder="Type a message..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={280}
          aria-label="Your message"
        />
        <button className="font-pixel pixel-border bg-accent text-accent-foreground px-4">Send</button>
      </form>
      <div className="text-xs text-muted-foreground text-right">{msg.length}/280 chars</div>
    </main>
  )
}
