/**
 * Database Debug API
 * 
 * Quick endpoint to check if all database tables exist and are configured correctly.
 * Use this to verify database setup after running SQL migrations.
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        const checks = []

        // Check users table
        const { data: usersTest, error: usersError } = await supabase
            .from('users')
            .select('count')
            .limit(1)

        checks.push({
            table: 'users',
            exists: !usersError,
            error: usersError?.message
        })

        // Check zk_credentials table
        const { data: zkTest, error: zkError } = await supabase
            .from('zk_credentials')
            .select('count')
            .limit(1)

        checks.push({
            table: 'zk_credentials',
            exists: !zkError,
            error: zkError?.message
        })

        // Check ens_subnames table
        const { data: ensTest, error: ensError } = await supabase
            .from('ens_subnames')
            .select('count')
            .limit(1)

        checks.push({
            table: 'ens_subnames',
            exists: !ensError,
            error: ensError?.message
        })

        // Check credential_uploads table
        const { data: uploadsTest, error: uploadsError } = await supabase
            .from('credential_uploads')
            .select('count')
            .limit(1)

        checks.push({
            table: 'credential_uploads',
            exists: !uploadsError,
            error: uploadsError?.message
        })

        const allTablesExist = checks.every(check => check.exists)

        return NextResponse.json({
            status: allTablesExist ? 'success' : 'incomplete',
            message: allTablesExist
                ? 'All database tables exist and are accessible'
                : 'Some database tables are missing or inaccessible',
            tables: checks,
            recommendation: allTablesExist
                ? 'Database setup is complete ✅'
                : 'Please run database-complete.sql in your Supabase SQL Editor'
        })

    } catch (error) {
        console.error('Database debug error:', error)
        return NextResponse.json({
            status: 'error',
            message: 'Failed to check database status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}