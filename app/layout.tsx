import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { Providers } from "./providers"

import { Press_Start_2P, JetBrains_Mono } from "next/font/google"

export const metadata: Metadata = {
  title: "HackerRep",
  description: "Pixel cyberpunk ETHGlobal reputation frontend",
  generator: "v0.app",
}

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${pixel.variable} ${jetbrains.variable} antialiased`}>
      <body className="font-sans">
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
