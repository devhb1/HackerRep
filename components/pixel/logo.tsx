"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  variant?: 'header' | 'hero' | 'footer'
  showTagline?: boolean
  hideText?: boolean
}

export function Logo({ className, variant = 'header', showTagline = true, hideText = false }: Props) {
  const logoSize = variant === 'hero' ? 'text-4xl md:text-6xl' : variant === 'header' ? 'text-xl md:text-2xl' : 'text-lg'
  const iconSize = variant === 'hero' ? 'text-5xl' : variant === 'header' ? 'text-2xl' : 'text-xl'

  return (
    <Link
      href="/"
      aria-label="HackerRep home"
      className={cn("inline-flex items-center gap-3 group", className)}
    >
      {/* Pixel Lock Icon */}
      <div className={cn(
        "relative pixel-border bg-gradient-to-br from-cyan-400 via-blue-500 to-green-400 p-2 rounded-lg",
        "group-hover:shadow-lg group-hover:shadow-cyan-400/50 transition-all duration-300",
        "animate-pulse-slow"
      )}>
        <div className="relative">
          {/* Lock Body */}
          <div className="absolute inset-0 bg-gray-900 rounded-sm"></div>
          {/* Lock Icon */}
          <div className={cn("relative flex items-center justify-center", iconSize)}>
            🔒
          </div>
          {/* Pixel effects */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Text */}
      {!hideText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-pixel text-primary tracking-tight transition-colors duration-300",
            "group-hover:text-cyan-400 glitch",
            logoSize
          )}>
            HackerRep
          </span>
          {showTagline && (
            <span className="text-xs text-muted-foreground font-mono">
              {variant === 'hero' ? 'Zero-Knowledge Reputation Protocol' : 'ZK Reputation'}
            </span>
          )}
        </div>
      )}

      {/* Floating particles effect */}
      {variant === 'hero' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
          <div className="absolute top-6 right-12 w-0.5 h-0.5 bg-green-400 rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-4 right-6 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-500"></div>
        </div>
      )}
    </Link>
  )
}
