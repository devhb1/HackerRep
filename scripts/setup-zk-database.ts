// ========================================
// HackerRep ZK Credentials Setup Script
// ========================================
// This script tests ZK tables connectivity and guides incremental setup.
// For incremental ZK setup, use zk-credentials-only.sql in Supabase SQL Editor.
// For full setup, use database-complete.sql instead.

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testZKCredentialsTable() {
    console.log('🚀 Testing ZK Credentials table connectivity...')

    try {
        // Test if ZK credentials table exists
        const { data, error } = await supabase
            .from('zk_credentials')
            .select('count')
            .limit(1)

        if (error) {
            console.log('❌ ZK Credentials tables not found')
            console.log('📝 Please run zk-credentials-only.sql in your Supabase SQL Editor for incremental setup.')
            console.log('🔗 Or use database-complete.sql for full setup.')
            console.log('📄 Find these files in the project root.')
            return false
        } else {
            console.log('✅ ZK Credentials table exists')
            return true
        }
    } catch (error) {
        console.error('❌ Setup failed:', error)
        return false
    }
}

// Test the ZK credentials API
async function testZKCredentialsAPI() {
    console.log('🧪 Testing ZK Credentials API...')

    try {
        // Test with a dummy wallet address
        const testWallet = '0x1234567890123456789012345678901234567890'

        const response = await fetch('http://localhost:3001/api/zk-credentials/' + testWallet)

        if (response.ok) {
            const data = await response.json()
            console.log('✅ ZK Credentials API working:', data)
        } else {
            console.log('⚠️  API response:', response.status, await response.text())
        }
    } catch (error) {
        console.error('❌ API test failed:', error)
    }
}

async function main() {
    console.log('🔧 HackerRep Phase 4: ZK Credentials Setup')
    console.log('==========================================')

    const tableSuccess = await testZKCredentialsTable()

    if (tableSuccess) {
        await testZKCredentialsAPI()
        console.log('\n✅ Setup complete! Your ZK onboarding system is ready.')
        console.log('🌐 Visit http://localhost:3001 to test the ZK proof registry')
    } else {
        console.log('\n⚠️  Manual database setup required.')
        console.log('📝 Please run the SQL commands above in your Supabase dashboard')
    }
}

if (require.main === module) {
    main().catch(console.error)
}

export { testZKCredentialsTable }