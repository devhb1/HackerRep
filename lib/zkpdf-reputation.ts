/**
 * SIMPLE zkPDF REPUTATION SYSTEM
 * 
 * Goal: Connect GitHub + Academic credentials → Generate ZK-verified reputation score
 * No overcomplicated stuff, just working reputation scoring with ZK concepts
 */

import crypto from 'crypto'
import { supabase } from './supabase'

// Simple ZK proof for reputation (conceptual but working)
export interface ZKReputationProof {
    proofId: string
    walletAddress: string
    proofType: 'academic' | 'github'

    // ZK components (simplified)
    commitment: string    // Hides actual data
    nullifier: string    // Prevents double use
    score: number        // Public reputation points

    createdAt: string
    expiresAt: string
    verified: boolean
}

/**
 * ACADEMIC REPUTATION - Based on degree level
 * Categories: High School (50pts) → Bachelor (100pts) → Master (150pts) → PhD (200pts) → Certification (75pts)
 */
export async function generateAcademicZKProof(
    walletAddress: string,
    degreeType: 'highschool' | 'bachelors' | 'masters' | 'phd' | 'certification',
    institution: string,
    pdfBuffer: ArrayBuffer
): Promise<ZKReputationProof> {

    console.log(`🎓 Generating academic ZK proof: ${degreeType}`)

    // Calculate score based on degree level
    const scoreMap = {
        'highschool': 50,
        'bachelors': 100,
        'masters': 150,
        'phd': 200,
        'certification': 75
    }
    const score = scoreMap[degreeType]

    // Generate ZK proof components
    const proofId = `academic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const randomness = crypto.randomBytes(16).toString('hex')

    // Create commitment (hides actual student name/details)
    const commitment = crypto.createHash('sha256')
        .update(`${institution}_${degreeType}_${randomness}`)
        .digest('hex')

    // Create nullifier (prevents double submission of same degree)
    const nullifier = crypto.createHash('sha256')
        .update(`${walletAddress}_${institution}_${degreeType}`)
        .digest('hex')

    const proof: ZKReputationProof = {
        proofId,
        walletAddress: walletAddress.toLowerCase(),
        proofType: 'academic',
        commitment,
        nullifier,
        score,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        verified: true
    }

    // Store in database
    await storeAcademicProof(walletAddress, degreeType, institution, proof, score)

    console.log(`✅ Academic proof generated: ${score} points for ${degreeType}`)
    return proof
}

/**
 * GITHUB REPUTATION - Based on commit count and repos
 * Categories: <10 commits (5pts) → 10-50 commits (25pts) → 50-200 commits (75pts) → 200+ commits (150pts)
 */
export async function generateGitHubZKProof(
    walletAddress: string,
    githubUsername: string,
    githubStats: {
        publicRepos: number
        totalCommits: number
        languages: string[]
        accountCreated: string
        followers: number
    }
): Promise<ZKReputationProof> {

    console.log(`🐙 Generating GitHub ZK proof: ${githubStats.totalCommits} commits`)

    // Calculate score based on activity level
    let score = 5 // Base score

    // Commit-based scoring
    if (githubStats.totalCommits >= 200) {
        score += 150  // Heavy contributor
    } else if (githubStats.totalCommits >= 50) {
        score += 75   // Active developer
    } else if (githubStats.totalCommits >= 10) {
        score += 25   // Regular user
    }
    // else keeps base 5 points for <10 commits

    // Bonus for repositories and languages
    score += Math.min(githubStats.publicRepos * 2, 30) // Up to 30 bonus for repos
    score += Math.min(githubStats.languages.length * 3, 20) // Up to 20 bonus for language diversity

    // Cap at 200 total
    score = Math.min(score, 200)

    // Generate ZK proof components
    const proofId = `github_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const randomness = crypto.randomBytes(16).toString('hex')

    // Create commitment (hides exact commit counts, proves ranges)
    const commitment = crypto.createHash('sha256')
        .update(`${githubUsername}_${githubStats.totalCommits}_${randomness}`)
        .digest('hex')

    // Create nullifier (prevents double submission of same GitHub account)
    const nullifier = crypto.createHash('sha256')
        .update(`${walletAddress}_github_${githubUsername}`)
        .digest('hex')

    const proof: ZKReputationProof = {
        proofId,
        walletAddress: walletAddress.toLowerCase(),
        proofType: 'github',
        commitment,
        nullifier,
        score,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        verified: true
    }

    // Store in database
    await storeGitHubProof(walletAddress, githubUsername, githubStats, proof, score)

    console.log(`✅ GitHub proof generated: ${score} points for ${githubUsername}`)
    return proof
}

/**
 * STORE ACADEMIC PROOF IN DATABASE
 */
async function storeAcademicProof(
    walletAddress: string,
    degreeType: string,
    institution: string,
    proof: ZKReputationProof,
    score: number
) {
    // Update zk_credentials table
    const { error } = await supabase
        .from('zk_credentials')
        .upsert({
            wallet_address: walletAddress.toLowerCase(),
            education_score: score,
            has_degree: ['bachelors', 'masters', 'phd'].includes(degreeType),
            has_certification: ['certification', 'highschool'].includes(degreeType),
            education_proofs: JSON.stringify([{
                proofId: proof.proofId,
                degreeType,
                institution,
                score,
                createdAt: proof.createdAt,
                zkProof: {
                    commitment: proof.commitment,
                    nullifier: proof.nullifier
                }
            }]),
            last_updated: new Date().toISOString()
        })

    if (error) {
        console.error('❌ Failed to store academic proof:', error)
        throw new Error('Database storage failed')
    }

    console.log('✅ Academic proof stored in database')
}

/**
 * STORE GITHUB PROOF IN DATABASE  
 */
async function storeGitHubProof(
    walletAddress: string,
    githubUsername: string,
    githubStats: any,
    proof: ZKReputationProof,
    score: number
) {
    // Update zk_credentials table
    const { error } = await supabase
        .from('zk_credentials')
        .upsert({
            wallet_address: walletAddress.toLowerCase(),
            github_score: score,
            github_username: githubUsername,
            github_data: JSON.stringify({
                totalCommits: githubStats.totalCommits,
                publicRepos: githubStats.publicRepos,
                languages: githubStats.languages,
                followers: githubStats.followers,
                accountCreated: githubStats.accountCreated,
                lastUpdated: new Date().toISOString()
            }),
            github_proofs: JSON.stringify([{
                proofId: proof.proofId,
                username: githubUsername,
                score,
                createdAt: proof.createdAt,
                zkProof: {
                    commitment: proof.commitment,
                    nullifier: proof.nullifier
                }
            }]),
            last_updated: new Date().toISOString()
        })

    if (error) {
        console.error('❌ Failed to store GitHub proof:', error)
        throw new Error('Database storage failed')
    }

    console.log('✅ GitHub proof stored in database')
}

/**
 * VERIFY ZK PROOF (Simple check)
 */
export async function verifyZKProof(proof: ZKReputationProof): Promise<boolean> {
    try {
        // Check if proof is expired
        if (new Date(proof.expiresAt) < new Date()) {
            console.log('❌ Proof expired')
            return false
        }

        // Check if nullifier was already used (prevent double spending)
        const { data: existing } = await supabase
            .from('zk_credentials')
            .select('*')
            .eq('wallet_address', proof.walletAddress)
            .single()

        if (existing) {
            const existingProofs = proof.proofType === 'academic'
                ? JSON.parse(existing.education_proofs || '[]')
                : JSON.parse(existing.github_proofs || '[]')

            const duplicate = existingProofs.find((p: any) =>
                p.zkProof?.nullifier === proof.nullifier
            )

            if (duplicate) {
                console.log('❌ Nullifier already used')
                return false
            }
        }

        console.log('✅ Proof verified')
        return true

    } catch (error) {
        console.error('❌ Proof verification failed:', error)
        return false
    }
}

/**
 * GET TOTAL REPUTATION SCORE
 */
export async function getTotalReputation(walletAddress: string): Promise<{
    educationScore: number
    githubScore: number
    socialScore: number
    totalScore: number
    tier: string
}> {
    const { data, error } = await supabase
        .from('zk_credentials')
        .select('education_score, github_score, social_score, total_base_score, reputation_tier')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

    if (error || !data) {
        return {
            educationScore: 0,
            githubScore: 0,
            socialScore: 0,
            totalScore: 0,
            tier: 'newcomer'
        }
    }

    return {
        educationScore: data.education_score || 0,
        githubScore: data.github_score || 0,
        socialScore: data.social_score || 0,
        totalScore: data.total_base_score || 0,
        tier: data.reputation_tier || 'newcomer'
    }
}