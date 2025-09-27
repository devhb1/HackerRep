"use client"

import { cn } from "@/lib/utils"
import React from "react"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "muted"
  pixel?: boolean
}

export const PixelButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, children, variant = "primary", pixel = true, ...props }, ref) => {
    const base =
      "relative inline-flex items-center justify-center px-4 py-3 text-sm md:text-base transition-transform active:scale-95 focus-visible-ring"
    const palette =
      variant === "primary"
        ? "bg-primary text-primary-foreground"
        : variant === "accent"
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-foreground"
    return (
      <button
        ref={ref}
        className={cn(base, palette, "pixel-border hover:glow", pixel ? "font-pixel tracking-tight" : "", className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
PixelButton.displayName = "PixelButton"
