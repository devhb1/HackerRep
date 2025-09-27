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
      "relative inline-flex items-center justify-center px-4 py-3 text-sm md:text-base transition-all duration-300 active:scale-95 focus-visible-ring overflow-hidden group"
    const palette =
      variant === "primary"
        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary"
        : variant === "accent"
          ? "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent"
          : "bg-gradient-to-r from-muted to-muted/80 text-foreground hover:from-muted/90 hover:to-muted"

    return (
      <button
        ref={ref}
        className={cn(
          base,
          palette,
          "pixel-border hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
          pixel ? "font-pixel tracking-tight" : "",
          className
        )}
        {...props}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600"></div>

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>

        {/* Corner glow effect */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    )
  },
)
PixelButton.displayName = "PixelButton"
