// API route to batch update user display names for ENS fallback
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        // 1. Find users who need display name update (ENS fallback)
        //    - display_name is a wallet address (starts with 0x)
        //    - ens_name is still null
        const { data: usersToUpdate } = await supabase
            .from('users')
            .select('*')
            .or('display_name.like.0x%,ens_name.is.null')

        // 2. If no users need updating, return early
        if (!usersToUpdate || usersToUpdate.length === 0) {
            return NextResponse.json({ message: 'No users need updating', updated: 0 })
        }

        let updatedCount = 0

        // 3. For each user, format wallet address for display fallback
        for (const user of usersToUpdate) {
            // Only update if display_name is a wallet address and not already formatted
            if (user.display_name.startsWith('0x') && user.display_name.length > 10) {
                // Format: 0x1234...abcd
                const formattedAddress = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`

                // Update user record in Supabase
                await supabase
                    .from('users')
                    .update({
                        display_name: formattedAddress,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)

                updatedCount++
            }
        }

        // 4. Return summary of updates
        return NextResponse.json({
            message: `Updated ${updatedCount} users`,
            updated: updatedCount
        })
    } catch (error) {
        // Log error for debugging
        console.error('Update users error:', error)
        return NextResponse.json({ error: 'Failed to update users' }, { status: 500 })
    }
}