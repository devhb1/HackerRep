import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Testing database connection...')
        
        // Test 1: Check environment variables
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('Environment check:', { hasUrl, hasKey })
        
        if (!hasUrl || !hasKey) {
            return NextResponse.json({
                error: 'Missing Supabase environment variables',
                details: {
                    hasUrl,
                    hasKey,
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
                    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
                }
            }, { status: 500 })
        }
        
        // Test 2: Try to connect to Supabase
        const { data, error } = await supabase
            .from('zk_credentials')
            .select('count')
            .limit(1)
        
        if (error) {
            console.error('Database connection error:', error)
            return NextResponse.json({
                error: 'Database connection failed',
                details: {
                    code: error.code,
                    message: error.message,
                    hint: error.hint,
                    details: error.details
                }
            }, { status: 500 })
        }
        
        // Test 3: Try to create a test record
        const testWallet = '0x' + '0'.repeat(40)
        const { data: testData, error: testError } = await supabase
            .from('zk_credentials')
            .upsert({
                wallet_address: testWallet,
                education_score: 0,
                github_score: 0,
                social_score: 0
            })
            .select()
            .single()
        
        if (testError) {
            console.error('Test record creation error:', testError)
            return NextResponse.json({
                error: 'Test record creation failed',
                details: {
                    code: testError.code,
                    message: testError.message,
                    hint: testError.hint,
                    details: testError.details
                }
            }, { status: 500 })
        }
        
        // Clean up test record
        await supabase
            .from('zk_credentials')
            .delete()
            .eq('wallet_address', testWallet)
        
        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            details: {
                environment: { hasUrl, hasKey },
                connection: 'OK',
                tableAccess: 'OK',
                recordCreation: 'OK'
            }
        })
        
    } catch (error) {
        console.error('Database test error:', error)
        return NextResponse.json({
            error: 'Database test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}