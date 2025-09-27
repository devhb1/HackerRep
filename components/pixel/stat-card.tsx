"use client"

import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("pixel-border bg-card p-4 md:p-6 glow", className)}>
      <div className="text-muted-foreground text-xs md:text-sm font-mono uppercase tracking-wide">{label}</div>
      <div className="font-pixel text-2xl md:text-3xl mt-2 text-primary">{value}</div>
    </div>
  )
}
