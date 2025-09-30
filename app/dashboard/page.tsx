'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { PixelButton } from '@/components/pixel/pixel-button'
import { VerificationStatus } from '@/components/verification-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

export default function PendingConnectionsDashboard() {
    const { address } = useAccount()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(false)
    const [listenerStatus, setListenerStatus] = useState<any>(null)
    const [checkingListener, setCheckingListener] = useState(false)

    // Fetch pending connection requests and check contract listener status
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

        async function checkListenerStatus() {
            try {
                setCheckingListener(true)
                const res = await fetch('/api/contract/status')
                const data = await res.json()
                setListenerStatus(data)
            } catch (error) {
                logger.error('Error checking listener status', { error: error instanceof Error ? error.message : error }, 'CONTRACT');
            } finally {
                setCheckingListener(false)
            }
        }

        fetchRequests()
        checkListenerStatus()
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

    const startContractListener = async () => {
        try {
            setCheckingListener(true)
            const res = await fetch('/api/contract/listen-events', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                // Refresh status after starting
                const statusRes = await fetch('/api/contract/status')
                const statusData = await statusRes.json()
                setListenerStatus(statusData)
            }
        } catch (error) {
            logger.error('Error starting listener', { error: error instanceof Error ? error.message : error }, 'CONTRACT');
        } finally {
            setCheckingListener(false)
        }
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
            <h1 className="font-pixel text-2xl text-primary glitch">Dashboard</h1>

            {/* Verification Status */}
            <VerificationStatus />

            {/* Contract Listener Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Contract Event Listener
                        <div className={`w-3 h-3 rounded-full ${listenerStatus?.status?.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {checkingListener ? (
                            <p className="text-sm text-muted-foreground">Checking listener status...</p>
                        ) : listenerStatus ? (
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <span className={listenerStatus.status?.isRunning ? 'text-green-600' : 'text-red-600'}>
                                        {listenerStatus.status?.isRunning ? 'Running' : 'Stopped'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Block:</span>
                                    <span className="font-mono">{listenerStatus.status?.lastProcessedBlock || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Contract:</span>
                                    <span className="font-mono text-xs">{listenerStatus.status?.contractAddress}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-red-600">Unable to check listener status</p>
                        )}

                        {!listenerStatus?.status?.isRunning && (
                            <Button
                                onClick={startContractListener}
                                disabled={checkingListener}
                                className="w-full"
                                variant="outline"
                            >
                                {checkingListener ? 'Starting...' : 'Start Contract Listener'}
                            </Button>
                        )}

                        <p className="text-xs text-muted-foreground">
                            The contract listener processes Self verification events from the blockchain.
                            It should start automatically, but you can manually start it if needed.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <h2 className="font-pixel text-xl text-primary">Pending Connections</h2>
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
