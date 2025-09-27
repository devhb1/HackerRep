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
    <div className={cn(
      "group pixel-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 md:p-6",
      "hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden",
      "hover:shadow-lg hover:shadow-primary/20",
      className
    )}>
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-muted-foreground text-xs md:text-sm font-mono uppercase tracking-wide group-hover:text-accent transition-colors">
          {label}
        </div>
        <div className="font-pixel text-2xl md:text-3xl mt-2 text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-green-400 transition-all duration-300">
          {value}
        </div>
      </div>

      {/* Corner accent */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
    </div>
  )
}
