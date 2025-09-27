'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { PixelButton } from '@/components/pixel/pixel-button'

export default function PendingConnectionsDashboard() {
    const { address } = useAccount()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(false)

    // Fetch pending connection requests for the logged-in user
    useEffect(() => {
        async function fetchRequests() {
            if (!address) return
            setLoading(true)
            const res = await fetch('/api/connections/pending', {
                headers: { 'x-wallet': address }
            })
            const data = await res.json()
            setRequests(data.requests || [])
            setLoading(false)
        }
        fetchRequests()
    }, [address])

    const handleAction = async (id: string, action: 'accept' | 'reject') => {
        if (!address) return
        setLoading(true)
        await fetch(`/api/connections/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id })
        })
        // Refresh requests
        const res = await fetch('/api/connections/pending', {
            headers: { 'x-wallet': address }
        })
        const data = await res.json()
        setRequests(data.requests || [])
        setLoading(false)
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
            <h1 className="font-pixel text-2xl text-primary glitch">Pending Connections</h1>
            <div className="pixel-border bg-card p-4">
                {loading && <div className="text-muted-foreground">Loading...</div>}
                {requests.length === 0 && !loading && (
                    <div className="text-muted-foreground">No pending requests</div>
                )}
                {requests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between py-2 border-b border-border">
                        <div>
                            <span className="font-pixel text-primary">{req.requester_ens || req.requester_display || req.requester_wallet}</span>
                            <span className="ml-2 text-xs text-muted-foreground">wants to connect</span>
                        </div>
                        <div className="flex gap-2">
                            <PixelButton variant="accent" onClick={() => handleAction(req.id, 'accept')}>Accept</PixelButton>
                            <PixelButton variant="muted" onClick={() => handleAction(req.id, 'reject')}>Reject</PixelButton>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
