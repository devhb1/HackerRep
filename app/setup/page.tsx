'use client'

import { useState } from 'react'
import { PixelButton } from '@/components/pixel/pixel-button'

export default function SetupPage() {
    const [setupStatus, setSetupStatus] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const setupDatabase = async () => {
        setIsLoading(true)
        setSetupStatus('Setting up database...')

        try {
            // Test if we can access the users table
            const response = await fetch('/api/users/search?q=test', { method: 'GET' })

            if (response.ok) {
                setSetupStatus('✅ Database is already set up and working!')
            } else {
                setSetupStatus(`
❌ Database needs to be updated to the latest schema. 

Please go to your Supabase Dashboard → SQL Editor and run the FIXED_DATABASE_SETUP.sql script.

This will create all the required tables for:
- Level 1: ZK Proof reputation system
- Level 2: Self Protocol verification  
- Level 3: Cultural intelligence voting

The script includes:
✅ Users table with reputation scoring
✅ ZK credentials and proofs tables
✅ Self Protocol verification tables
✅ Voting system with demographic intelligence
✅ All necessary indexes and triggers

After running the script, refresh this page to verify the setup!
        `)
            }
        } catch (error) {
            setSetupStatus(`❌ Error: ${error}`)
        }

        setIsLoading(false)
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
            <h1 className="font-pixel text-2xl text-primary glitch">DATABASE SETUP</h1>

            <div className="pixel-border bg-card p-6">
                <div className="space-y-4">
                    <p className="text-foreground">
                        Click button below to test if our Supabase database is set up correctly:
                    </p>

                    <PixelButton
                        onClick={setupDatabase}
                        disabled={isLoading}
                        variant="primary"
                    >
                        {isLoading ? 'Checking...' : 'Test Database Setup'}
                    </PixelButton>

                    {setupStatus && (
                        <pre className="bg-muted p-4 rounded text-xs overflow-auto whitespace-pre-wrap">
                            {setupStatus}
                        </pre>
                    )}
                </div>
            </div>
        </main>
    )
}