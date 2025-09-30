'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    // Auto-start contract event listener on app load (production-ready)
    useEffect(() => {
        const startContractListener = async () => {
            try {
                // Only start in production or when explicitly enabled
                if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_CONTRACT_LISTENER) {
                    logger.info('Contract listener disabled in development mode', null, 'INIT');
                    return;
                }

                logger.info('Auto-starting contract event listener...', null, 'INIT');

                // First check if listener is already running
                const statusResponse = await fetch('/api/contract/status');
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    if (statusData.isRunning) {
                        logger.info('Contract listener already running', { lastBlock: statusData.lastProcessedBlock }, 'INIT');
                        return;
                    }
                }

                // Start the listener with retry logic
                const response = await fetch('/api/contract/listen-events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    logger.info('Contract event listener started successfully', { message: data.message }, 'INIT');
                } else {
                    const errorText = await response.text();
                    logger.warn('Failed to start contract listener', { error: errorText, status: response.status }, 'INIT');
                }
            } catch (error) {
                logger.error('Error starting contract listener', {
                    error: error instanceof Error ? error.message : error,
                    stack: error instanceof Error ? error.stack : undefined
                }, 'INIT');
            }
        };

        // Only attempt auto-start in browser environment
        if (typeof window !== 'undefined') {
            // Add a delay to allow the app to fully load and avoid serverless cold start issues
            const timeout = setTimeout(startContractListener, 5000);
            return () => clearTimeout(timeout);
        }
    }, []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#6366f1',
                        borderRadius: 'large',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}