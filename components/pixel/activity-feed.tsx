"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

type Activity = {
  id: string
  activity_type: string
  description: string
  created_at: string
  user: {
    ens_name?: string
    display_name: string
    avatar_url?: string
    wallet_address: string
  }
}

export function ActivityFeed({ className }: { className?: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities?limit=10')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime()
    const time = new Date(timestamp).getTime()
    const diff = Math.floor((now - time) / 1000)

    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  const getDisplayName = (user: Activity['user']) => {
    if (user.ens_name) return user.ens_name
    if (user.display_name && !user.display_name.startsWith('0x')) return user.display_name
    return `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
  }

  const getUpdatedDescription = (activity: Activity) => {
    const displayName = getDisplayName(activity.user)
    // Replace wallet addresses or old display names in activity descriptions
    if (activity.description.includes('New hacker joined:')) {
      return `New hacker joined: ${displayName}`
    }
    return activity.description
  }

  return (
    <div className={cn("pixel-border bg-card p-4 md:p-6 overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-primary text-base">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Auto-updating</span>
      </div>
      <div className="mt-4 h-40 md:h-48 overflow-y-auto scanlines pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="text-sm">Loading activities...</span>
          </div>
        ) : activities.length > 0 ? (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded pixel-border bg-muted flex items-center justify-center overflow-hidden">
                    {activity.user.avatar_url ? (
                      <img
                        src={activity.user.avatar_url}
                        alt=""
                        className="size-7 rounded object-cover"
                        onError={() => {
                          // If image fails to load, we'll show the fallback initials
                        }}
                      />
                    ) : (
                      <div className="size-7 rounded bg-accent flex items-center justify-center text-xs font-pixel">
                        {getDisplayName(activity.user)?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{getUpdatedDescription(activity)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(activity.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="text-sm">No activities yet. Connect your wallet to get started!</span>
          </div>
        )}
      </div>
    </div>
  )
}
