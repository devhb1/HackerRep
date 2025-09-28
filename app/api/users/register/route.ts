import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, ensName, displayName, avatarUrl } = await request.json()

        // Check if user exists (case-insensitive)
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single()

        if (existingUser) {
            // Always update if we have new ENS data or avatar
            const shouldUpdate = (
                (ensName && ensName !== existingUser.ens_name) ||
                (avatarUrl && avatarUrl !== existingUser.avatar_url) ||
                (ensName && !existingUser.ens_name) || // New ENS for user without ENS
                (!existingUser.ens_name && existingUser.display_name.startsWith('0x')) // Wallet address as display name
            )

            if (shouldUpdate) {
                const finalDisplayName = ensName || existingUser.ens_name || displayName
                const finalAvatarUrl = avatarUrl || existingUser.avatar_url

                const { data: updatedUser } = await supabase
                    .from('users')
                    .update({
                        ens_name: ensName || existingUser.ens_name,
                        display_name: finalDisplayName,
                        avatar_url: finalAvatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single()

                return NextResponse.json({ user: updatedUser, isNew: false })
            }

            return NextResponse.json({ user: existingUser, isNew: false })
        }

        // Create new user with BASE RATING 100
        // Prioritize ENS name for display, fallback to formatted wallet address
        const finalDisplayName = ensName || displayName
        const finalAvatarUrl = avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${walletAddress}`

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                wallet_address: walletAddress.toLowerCase(),
                ens_name: ensName,
                display_name: finalDisplayName,
                avatar_url: finalAvatarUrl,
                reputation_score: 100 // BASE RATING
            })
            .select()
            .single()

        if (error) throw error

        // Create activity for new user joining
        if (newUser) {
            await supabase
                .from('activities')
                .insert({
                    user_id: newUser.id,
                    activity_type: 'user_joined',
                    description: `New hacker joined: ${finalDisplayName}`
                })
        }

        return NextResponse.json({ user: newUser, isNew: true })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}