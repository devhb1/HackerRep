import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Reject a connection request
export async function POST(request: Request) {
    const { requestId } = await request.json()
    // Update status to rejected
    const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
