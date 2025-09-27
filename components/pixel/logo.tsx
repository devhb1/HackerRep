"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

type Props = { className?: string }

export function Logo({ className }: Props) {
  return (
    <Link href="/" aria-label="HackerRep home" className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-pixel glitch text-xl md:text-2xl text-primary tracking-tight">HackerRep</span>
      <span className="text-xs md:text-sm text-muted-foreground">ETHGlobal Reputation</span>
    </Link>
  )
}
