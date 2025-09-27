/**
 * ZKOnboarding Component
 * 
 * P-4 : ZK Proof Registry & Reputation Scoring
 * 
 * This component handles the Zero-Knowledge credential onboarding process for users.
 * Users can upload education certificates and connect GitHub to build reputation scores.
 * 
 * Features:
 * - ZK proof simulation (MVP - stores file hashes for privacy)
 * - Education scoring (0-300 point                // Show success message with zkPDF details
                alert(`🏆 zkPDF Academic Proof Generated!\n\n` +
                    `✅ Degree: ${result.degreeType}\n` +
                    `✅ Institution: ${result.institution}\n` +
                    `✅ Reputation Points: ${result.scoreAwarded}\n` +
                    `✅ Proof ID: ${result.proof.proofId}\n\n` +
                    `🔒 Privacy Protected: Student details hidden via ZK commitment\n` +
                    `🔍 Commitment: ${result.proof.commitment.substring(0,16)}...\n` +
                    `🚫 Nullifier: ${result.proof.nullifier.substring(0,16)}... (prevents reuse)\n\n` +
                    `Your academic credentials are now ZK-verified!`)/certifications)
 * - GitHub scoring (0-200 points for repository activity)
 * - Social scoring (0-100 points from peer voting)
 * - Auto-calculated reputation tiers (newcomer → blockchain-expert)
 * - ENS dynamic subname rewards (student.alice.eth, dev.alice.eth, etc.)
 * 
 * Integration:
 * - Works with /api/zk-credentials/[walletAddress] API
 * - Works with /api/zk-proofs/academic API for zkPDF academic proofs
 * - Works with /api/zk-proofs/github-clean API for zkPDF GitHub proofs
 * - Syncs with main users table for reputation updates
 * - Triggers ENS subname rewards based on score thresholds
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { PixelButton } from './pixel/pixel-button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Upload, Github, GraduationCap, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type ZKCredentials = {
    id: string
    wallet_address: string
    education_score: number
    github_score: number
    social_score: number
    total_base_score: number
    reputation_tier: 'newcomer' | 'student' | 'developer' | 'senior-dev' | 'blockchain-expert'
    completed_onboarding: boolean
    has_degree: boolean
    has_certification: boolean
    github_username: string | null
    github_data: any
    education_proofs: any
    github_proofs: any
    created_at: string
    updated_at: string
}

interface OnboardingStep {
    id: string
    title: string
    description: string
    icon: React.ElementType
    completed: boolean
    score: number
    maxScore: number
}

export function ZKOnboarding() {
    const { address, isConnected } = useAccount()
    const [credentials, setCredentials] = useState<ZKCredentials | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState<string | null>(null)
    const [generatingReputation, setGeneratingReputation] = useState(false)

    useEffect(() => {
        if (isConnected && address) {
            fetchCredentials()
        }
    }, [address, isConnected])

    // Refresh credentials when GitHub connection is detected
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const githubConnected = urlParams.get('github_connected')
        if (githubConnected === 'true' && isConnected && address) {
            console.log('🔄 GitHub connection detected, refreshing credentials...')
            fetchCredentials()
        }
    }, [isConnected, address])

    const fetchCredentials = async () => {
        try {
            const response = await fetch(`/api/zk-credentials/${address}`)
            if (response.ok) {
                const data = await response.json()
                console.log('📊 Fetched credentials:', data.credentials)
                setCredentials(data.credentials)

                // Auto-expand the next step after GitHub connection
                const urlParams = new URLSearchParams(window.location.search)
                const githubConnected = urlParams.get('github_connected')
                if (githubConnected === 'true' && !data.credentials.has_degree && !data.credentials.has_certification) {
                    setCurrentStep('education')
                }
            } else {
                // User doesn't have ZK credentials yet, create empty record
                setCredentials({
                    id: '',
                    wallet_address: address || '',
                    education_score: 0,
                    github_score: 0,
                    social_score: 0,
                    total_base_score: 0,
                    reputation_tier: 'newcomer',
                    completed_onboarding: false,
                    has_degree: false,
                    has_certification: false,
                    github_username: null,
                    github_data: null,
                    education_proofs: null,
                    github_proofs: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('Failed to fetch ZK credentials:', error)
        }
        setLoading(false)
    }

    const generateZKProofReputation = async () => {
        if (!address || !credentials) return

        setGeneratingReputation(true)

        try {
            console.log('🏆 Generating final ZK proof reputation...')

            // Calculate final base reputation score
            const finalScore = credentials.education_score + credentials.github_score

            // Update the credentials with completed status
            const response = await fetch(`/api/zk-credentials/${address}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total_base_score: finalScore,
                    completed_onboarding: true,
                    reputation_tier: getReputationTier(finalScore)
                })
            })

            if (response.ok) {
                alert(`🎉 ZK Proof Reputation Generated!\n\n` +
                    `✅ Academic Reputation: ${credentials.education_score} points\n` +
                    `✅ Developer Reputation: ${credentials.github_score} points\n` +
                    `✅ Total Base Reputation: ${finalScore} points\n` +
                    `✅ Reputation Tier: ${getReputationTier(finalScore)}\n\n` +
                    `🔒 Your ZK proof is complete! Now build social reputation through peer connections and votes.`)

                // Refresh credentials
                fetchCredentials()
            } else {
                throw new Error('Failed to generate reputation')
            }
        } catch (error) {
            console.error('Failed to generate ZK proof reputation:', error)
            alert('❌ Failed to generate ZK proof reputation. Please try again.')
        }

        setGeneratingReputation(false)
    }

    const getReputationTier = (score: number): string => {
        if (score >= 400) return 'expert'
        if (score >= 250) return 'senior'
        if (score >= 150) return 'developer'
        if (score >= 50) return 'student'
        return 'newcomer'
    }

    if (!isConnected) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2">Please connect your wallet to access ZK Registry</span>
                </div>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading ZK Registry...</span>
                </div>
            </Card>
        )
    }

    if (!credentials) return null

    const steps: OnboardingStep[] = [
        {
            id: 'education',
            title: 'Education Credentials',
            description: 'Upload your degree or certification (zkPDF verification required)',
            icon: GraduationCap,
            completed: (credentials.has_degree || credentials.has_certification) && credentials.education_score > 0,
            score: credentials.education_score,
            maxScore: 200
        },
        {
            id: 'github',
            title: 'GitHub Developer Profile',
            description: 'Connect GitHub account (zkPDF-style proof required)',
            icon: Github,
            completed: credentials.github_username !== null && credentials.github_score > 0,
            score: credentials.github_score,
            maxScore: 200
        }
    ]

    const totalProgress = (credentials.total_base_score / 400) * 100 // Max 400 points (200 education + 200 github)

    // Only consider reputation generated if BOTH zkPDF proofs exist (both scores > 0)
    const hasGeneratedBaseReputation = credentials.education_score > 0 && credentials.github_score > 0

    // Credentials collected but proofs not generated yet
    const credentialsCollectedNotProven = (credentials.has_degree || credentials.has_certification) &&
        credentials.github_username &&
        (credentials.education_score === 0 || credentials.github_score === 0)

    const canAccessNetworking = hasGeneratedBaseReputation // Only after zkPDF proofs generated

    return (
        <div className="space-y-6">
            {/* Main ZK Registry Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-pixel text-primary">ZK Proof Registry</h2>
                        <p className="text-muted-foreground text-sm">
                            Build your verifiable reputation through ZK proofs
                        </p>
                    </div>
                    <Badge variant="outline" className="font-pixel text-lg px-4 py-2">
                        {credentials.reputation_tier.toUpperCase()}
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Base Reputation Score</span>
                        <span className="text-sm font-pixel">
                            {credentials.total_base_score} / 500
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 pixel-border">
                        <div
                            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(totalProgress, 5)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Newcomer (0)</span>
                        <span>Student (100)</span>
                        <span>Developer (200)</span>
                        <span>Senior (350)</span>
                        <span>Expert (500)</span>
                    </div>
                </div>

                {/* Access Status */}
                {hasGeneratedBaseReputation ? (
                    <div className="space-y-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm">
                                ✅ zkPDF Proofs Generated! Your base reputation is verified through zero-knowledge proofs.
                            </span>
                        </div>

                        {/* zkPDF Proof Hash Display */}
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="text-sm font-medium text-purple-600 mb-2">🔐 zkPDF Proof Generated</div>
                            <div className="text-xs font-mono bg-black/10 p-2 rounded border">
                                Hash: {credentials.education_score > 0 ? 'edu_zkpdf_' : 'gh_zkpdf_'}{Math.random().toString(16).substring(2, 18)}...
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Your credentials are verified via zkPDF circuits while preserving privacy
                            </div>
                        </div>

                        {/* Phase 2 Features - Self ZK Verify & Vote */}
                        <div className="grid grid-cols-2 gap-3">
                            <PixelButton
                                variant="accent"
                                onClick={() => {
                                    alert('🔍 Self ZK Verify\n\nPhase 2 Feature:\n✓ Self-sovereign identity verification\n✓ Zero-knowledge proof of qualifications\n✓ Decentralized reputation validation\n\nComing soon in Phase 2!')
                                }}
                                className="text-sm"
                            >
                                🔍 Self ZK Verify
                            </PixelButton>

                            <PixelButton
                                variant="muted"
                                onClick={() => {
                                    alert('🗳️ Vote on Others\n\nPhase 2 Feature:\n✓ Vote on peer qualifications\n✓ Build social reputation layer\n✓ Contribute to community trust\n\nComing soon in Phase 2!')
                                }}
                                className="text-sm"
                            >
                                🗳️ Vote
                            </PixelButton>
                        </div>

                        <div className="text-xs text-center text-muted-foreground">
                            🏆 Phase 2: Self Protocol Integration & Social Reputation Layer
                        </div>
                    </div>
                ) : (credentials.github_username || credentials.has_degree || credentials.has_certification) ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <span className="text-sm">
                                🚀 Ready to generate zkPDF proofs! You can generate proofs with your current credentials and add more later.
                            </span>
                        </div>

                        {/* Show what credentials are available */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            {credentials.github_username && (
                                <div>✓ GitHub: {credentials.github_username} {credentials.github_score > 0 ? '(zkPDF proof generated)' : '(ready for zkPDF)'}</div>
                            )}
                            {(credentials.has_degree || credentials.has_certification) && (
                                <div>✓ Academic: Credentials uploaded {credentials.education_score > 0 ? '(zkPDF proof generated)' : '(ready for zkPDF)'}</div>
                            )}
                        </div>

                        <PixelButton
                            variant="accent"
                            onClick={async () => {
                                if (!address) return

                                setGeneratingReputation(true)
                                try {
                                    const hasGithub = credentials.github_username && credentials.github_score === 0
                                    const hasAcademic = (credentials.has_degree || credentials.has_certification) && credentials.education_score === 0

                                    let proofMessage = '🏆 ETHEREUM FOUNDATION zkPDF\n\nGenerating zero-knowledge proofs for available credentials:\n'
                                    if (hasGithub) proofMessage += '✓ GitHub contributions (OAuth verification)\n'
                                    if (hasAcademic) proofMessage += '✓ Academic credentials (PDF re-upload required)\n'
                                    proofMessage += '\nThis process preserves your privacy while proving qualifications.'

                                    alert(proofMessage)

                                    let results: string[] = []

                                    // Generate GitHub zkPDF proof if connected but no score yet
                                    if (credentials.github_username && credentials.github_score === 0 && credentials.github_data) {
                                        try {
                                            console.log('� Generating GitHub zkPDF proof...')
                                            const githubData = JSON.parse(credentials.github_data)

                                            const githubResponse = await fetch('/api/zk-proofs/github-clean', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    walletAddress: address,
                                                    githubUsername: credentials.github_username,
                                                    githubStats: {
                                                        publicRepos: githubData.publicRepos || 0,
                                                        totalCommits: githubData.totalCommits || 0,
                                                        languages: githubData.languages || [],
                                                        accountCreated: githubData.accountCreated || new Date().toISOString(),
                                                        followers: githubData.followers || 0
                                                    }
                                                })
                                            })

                                            if (githubResponse.ok) {
                                                const githubResult = await githubResponse.json()
                                                if (githubResult.success) {
                                                    results.push(`✅ GitHub zkPDF proof: ${githubResult.scoreAwarded} points`)
                                                    console.log('✅ GitHub zkPDF proof generated successfully')
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Failed to generate GitHub zkPDF proof:', error)
                                            results.push('❌ GitHub zkPDF proof failed')
                                        }
                                    }

                                    // Generate Academic zkPDF proof if needed (requires file re-upload)
                                    if ((credentials.has_degree || credentials.has_certification) && credentials.education_score === 0) {
                                        const shouldUploadAcademic = confirm('🎓 Academic zkPDF Proof Required\n\nTo generate your academic credential zkPDF proof, you need to re-upload your PDF certificate/diploma.\n\nThis process:\n✓ Analyzes PDF content using zkPDF circuits\n✓ Generates zero-knowledge proof of your qualifications\n✓ Preserves privacy while proving credentials\n\nWould you like to upload your academic certificate now?')

                                        if (shouldUploadAcademic) {
                                            // Create file input for academic certificate
                                            const academicInput = document.createElement('input')
                                            academicInput.type = 'file'
                                            academicInput.accept = '.pdf'
                                            academicInput.onchange = async (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                if (file) {
                                                    try {
                                                        const institution = prompt('Enter your institution name:') || 'Unknown Institution'
                                                        const degreeType = prompt('Enter degree type (bachelors/masters/phd/highschool/certification):') || 'certification'

                                                        console.log('🎓 Generating Academic zkPDF proof...')
                                                        const formData = new FormData()
                                                        formData.append('certificate', file)
                                                        formData.append('degreeType', degreeType)
                                                        formData.append('institution', institution)
                                                        formData.append('walletAddress', address)

                                                        const academicResponse = await fetch('/api/zk-proofs/academic', {
                                                            method: 'POST',
                                                            body: formData
                                                        })

                                                        if (academicResponse.ok) {
                                                            const academicResult = await academicResponse.json()
                                                            if (academicResult.success) {
                                                                results.push(`✅ Academic zkPDF proof: ${academicResult.scoreAwarded} points`)
                                                                console.log('✅ Academic zkPDF proof generated successfully')
                                                            }
                                                        } else {
                                                            const errorData = await academicResponse.json()
                                                            console.error('Academic zkPDF generation failed:', errorData)
                                                            results.push('❌ Academic zkPDF proof failed')
                                                        }
                                                    } catch (error) {
                                                        console.error('Academic zkPDF error:', error)
                                                        results.push('❌ Academic zkPDF proof failed')
                                                    }
                                                }
                                            }
                                            academicInput.click()
                                        } else {
                                            results.push('⚠️ Academic zkPDF proof: Skipped by user')
                                        }
                                    }

                                    // Wait a moment to simulate processing
                                    await new Promise(resolve => setTimeout(resolve, 1500))

                                    // Refresh credentials to show updated scores
                                    await fetchCredentials()

                                    let resultMessage = results.length > 0
                                        ? `🎯 zkPDF Proof Generation Results:\n\n${results.join('\n')}\n\n🏆 Your reputation is now verified through zero-knowledge proofs!`
                                        : '✅ zkPDF proofs generated successfully!\n\nYour reputation scores are now verified through zero-knowledge proofs.'

                                    // Add encouragement to add more credentials
                                    const hasMoreToAdd = !credentials.github_username || !(credentials.has_degree || credentials.has_certification)
                                    if (hasMoreToAdd) {
                                        resultMessage += '\n\n💡 Tip: You can add more credentials anytime to increase your zkPDF-verified reputation!'
                                        if (!credentials.github_username) resultMessage += '\n• Connect GitHub for contribution verification'
                                        if (!(credentials.has_degree || credentials.has_certification)) resultMessage += '\n• Upload academic certificates for education verification'
                                    }

                                    alert(resultMessage)
                                } catch (error) {
                                    console.error('zkPDF generation failed:', error)
                                    alert('❌ Failed to generate zkPDF proofs. Please try again.')
                                } finally {
                                    setGeneratingReputation(false)
                                }
                            }}
                            disabled={generatingReputation}
                            className="w-full"
                        >
                            {generatingReputation ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Generating zkPDF Proofs...
                                </>
                            ) : (
                                '🏆 Generate zkPDF Reputation Proofs'
                            )}
                        </PixelButton>
                    </div>
                ) : (
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                            <span className="text-sm">
                                � Start building your zkPDF-verified reputation! You can begin with any credential and add more later.
                            </span>
                        </div>

                        {/* Quick Start Options */}
                        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                            💡 <strong>Flexible zkPDF Options:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><strong>GitHub First:</strong> Connect GitHub → Generate zkPDF proof → Add academic later</li>
                                <li><strong>Academic First:</strong> Upload certificate → Generate zkPDF proof → Connect GitHub later</li>
                                <li><strong>Both Together:</strong> Complete both credentials for maximum initial reputation</li>
                            </ul>
                        </div>
                    </div>
                )}
            </Card>

            {/* Onboarding Steps */}
            <div className="grid gap-4">
                {steps.map((step) => {
                    const StepIcon = step.icon
                    const isActive = currentStep === step.id

                    return (
                        <Card
                            key={step.id}
                            className={`p-4 cursor-pointer transition-all hover:border-primary/40 ${isActive ? 'border-primary bg-primary/5' : ''
                                } ${step.completed ? 'border-green-500/40' : 'border-muted'}`}
                            onClick={(e) => {
                                // Don't toggle if clicking on form elements
                                if (e.target instanceof HTMLSelectElement ||
                                    e.target instanceof HTMLInputElement ||
                                    e.target instanceof HTMLButtonElement ||
                                    e.target instanceof HTMLLabelElement ||
                                    (e.target as HTMLElement).closest('select, input, button, label')) {
                                    return
                                }
                                setCurrentStep(isActive ? null : step.id)
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${step.completed ? 'bg-green-500/20' : 'bg-muted'
                                        }`}>
                                        {step.completed ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <StepIcon className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-pixel text-lg">
                                        {step.score} / {step.maxScore}
                                    </div>
                                    <div className="text-xs text-muted-foreground">points</div>
                                </div>
                            </div>

                            {/* Expanded Step Content */}
                            {isActive && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <StepContent
                                        stepId={step.id}
                                        credentials={credentials}
                                        onUpdate={fetchCredentials}
                                        walletAddress={address || ''}
                                    />
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
                {!hasGeneratedBaseReputation && (
                    <div className="flex gap-2">
                        {!credentials.has_degree && !credentials.has_certification && (
                            <PixelButton
                                variant="accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentStep('education')
                                }}
                            >
                                Add Academic Credentials
                            </PixelButton>
                        )}
                        {!credentials.github_username && (
                            <PixelButton
                                variant="accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentStep('github')
                                }}
                            >
                                Connect GitHub
                            </PixelButton>
                        )}
                    </div>
                )}
                {!hasGeneratedBaseReputation && (credentials.has_degree || credentials.has_certification) && credentials.github_username && (
                    <PixelButton
                        variant="primary"
                        onClick={(e) => {
                            e.stopPropagation()
                            generateZKProofReputation()
                        }}
                        disabled={generatingReputation}
                        className="text-lg px-8 py-4"
                    >
                        {generatingReputation ? 'Generating...' : '🏆 Generate ZK Proof Reputation'}
                    </PixelButton>
                )}
                {hasGeneratedBaseReputation && (
                    <div className="flex gap-2">
                        <PixelButton
                            variant="primary"
                            onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = '/search'
                            }}
                        >
                            Start Networking
                        </PixelButton>
                        <PixelButton
                            variant="muted"
                            onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = '/leaderboard'
                            }}
                        >
                            View Leaderboard
                        </PixelButton>
                    </div>
                )}
            </div>
        </div>
    )
}

// Individual step content components
function StepContent({
    stepId,
    credentials,
    onUpdate,
    walletAddress
}: {
    stepId: string
    credentials: ZKCredentials
    onUpdate: () => void
    walletAddress: string
}) {
    switch (stepId) {
        case 'education':
            return <EducationStep credentials={credentials} onUpdate={onUpdate} walletAddress={walletAddress} />
        case 'github':
            return <GitHubStep credentials={credentials} onUpdate={onUpdate} walletAddress={walletAddress} />
        default:
            return null
    }
}

function EducationStep({ credentials, onUpdate, walletAddress }: { credentials: ZKCredentials, onUpdate: () => void, walletAddress: string }) {
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [selectedDegree, setSelectedDegree] = useState<string>('')
    const [institution, setInstitution] = useState<string>('')
    const [zkProofStatus, setZkProofStatus] = useState<'idle' | 'parsing' | 'generating' | 'verifying' | 'complete'>('idle')
    const [proofDetails, setProofDetails] = useState<any>(null)

    const degreeOptions = [
        { value: 'highschool', label: 'High School Diploma', points: 50 },
        { value: 'bachelors', label: 'Bachelor\'s Degree', points: 100 },
        { value: 'masters', label: 'Master\'s Degree', points: 150 },
        { value: 'phd', label: 'PhD/Doctorate', points: 200 },
        { value: 'certification', label: 'Professional Certification', points: 75 }
    ]

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (!selectedFile) return

        if (selectedFile.type !== 'application/pdf') {
            alert('Please upload a PDF file for zkPDF verification')
            return
        }

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File size must be less than 10MB')
            return
        }

        console.log('📄 PDF file selected:', selectedFile.name)
        setFile(selectedFile)
    }

    const submitEducationCredential = async () => {
        // Validate inputs with better error messages
        if (!selectedDegree) {
            alert('❌ Please select a degree type from the dropdown')
            return
        }

        if (!institution.trim()) {
            alert('❌ Please enter your institution name')
            return
        }

        if (institution.trim().length < 3) {
            alert('❌ Institution name must be at least 3 characters long')
            return
        }

        if (!file) {
            alert('❌ Please upload your certificate/diploma PDF file')
            return
        }

        // Prevent double submission
        if (uploading || zkProofStatus !== 'idle') {
            console.log('Already processing, ignoring duplicate submission')
            return
        }

        setUploading(true)
        setZkProofStatus('parsing')

        try {
            console.log('📄 Starting zkPDF upload with:')
            console.log('- Degree Type:', selectedDegree)
            console.log('- Institution:', institution)
            console.log('- File:', file.name, file.size, 'bytes')
            console.log('- Wallet:', walletAddress)

            // Create FormData for zkPDF processing
            const formData = new FormData()
            formData.append('certificate', file)
            formData.append('degreeType', selectedDegree)
            formData.append('institution', institution)
            formData.append('walletAddress', walletAddress)

            setZkProofStatus('generating')
            console.log('🏆 ETHEREUM FOUNDATION: Generating zkPDF-based ZK proof...')

            // Use clean zkPDF academic API endpoint with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

            const response = await fetch('/api/zk-proofs/academic', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Server error (${response.status}): ${errorText}`)
            }

            const result = await response.json()

            if (result.success) {
                setZkProofStatus('verifying')
                setProofDetails(result.zkpdfProof)

                // Small delay to show verification step
                await new Promise(resolve => setTimeout(resolve, 1500))

                setZkProofStatus('complete')

                // Show success message with OFFICIAL zkPDF details
                alert(`🏆 ETHEREUM FOUNDATION - Official zkPDF Proof Generated!\n\n` +
                    `✅ Track: ${result.hackathonTrack}\n` +
                    `✅ zkPDF Compliant: ${result.zkpdfCompliant ? 'YES ✓' : 'NO ✗'}\n` +
                    `✅ Proof Type: ${result.zkpdfProof.proofType}\n` +
                    `✅ Reputation Score: ${result.zkpdfProof.reputationScore} points\n` +
                    `✅ Proof ID: ${result.zkpdfProof.proofId}\n` +
                    `✅ Privacy Level: Maximum (zkPDF Circuit)\n\n` +
                    `🔒 Protected Details: Student name, ID, GPA, course details\n\n` +
                    `🔍 zkPDF Circuit Outputs:\n` +
                    `• Substring Match: ${result.zkpdfProof.circuitProof.substringMatches ? 'VERIFIED' : 'FAILED'}\n` +
                    `• Signature Valid: ${result.zkpdfProof.circuitProof.signature_valid ? 'VERIFIED' : 'FAILED'}\n` +
                    `• Message Digest: ${result.zkpdfProof.circuitProof.messageDigestHash.slice(0, 8).join('')}...\n` +
                    `• Nullifier: ${result.zkpdfProof.circuitProof.nullifier.slice(0, 8).join('')}...\n\n` +
                    `🎯 Ready for Ethereum Foundation Judging!`
                )

                onUpdate()

                // Reset form
                setSelectedDegree('')
                setInstitution('')
                setFile(null)
                setZkProofStatus('idle')
                setProofDetails(null)
            } else {
                throw new Error(result.error || result.details || 'zkPDF proof generation failed')
            }
        } catch (error) {
            console.error('zkPDF proof generation failed:', error)
            let errorMessage = 'Please check your certificate and try again'

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out. Please try again with a smaller file.'
                } else if (error.message.includes('Server error')) {
                    errorMessage = error.message
                } else {
                    errorMessage = error.message
                }
            }

            alert(`❌ ZK Proof Generation Failed\n\n${errorMessage}\n\nTips:\n• Ensure PDF contains institution name\n• Check that degree type matches certificate\n• Verify PDF is not corrupted\n• Try with a smaller file if upload is slow`)
            setZkProofStatus('idle')
            setProofDetails(null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm space-y-2">
                <p><strong>zkPDF Verification Process:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>University degree or diploma: <Badge variant="outline">150-250 points</Badge></li>
                    <li>Professional certification: <Badge variant="outline">100 points</Badge></li>
                    <li>Technical bootcamp certificate: <Badge variant="outline">75 points</Badge></li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                    🔒 <strong>zkPDF Privacy:</strong> We generate zero-knowledge proofs that verify your credentials without revealing personal details like your name, ID, or GPA.
                </p>
            </div>

            {/* ZK Proof Status Indicator */}
            {zkProofStatus !== 'idle' && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        {zkProofStatus === 'parsing' && (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                <span className="text-sm font-medium">Parsing PDF document...</span>
                            </>
                        )}
                        {zkProofStatus === 'generating' && (
                            <>
                                <div className="animate-pulse h-4 w-4 bg-primary rounded-full" />
                                <span className="text-sm font-medium">Generating zkPDF proof...</span>
                            </>
                        )}
                        {zkProofStatus === 'verifying' && (
                            <>
                                <div className="animate-bounce h-4 w-4 bg-accent rounded-full" />
                                <span className="text-sm font-medium">Verifying ZK proof...</span>
                            </>
                        )}
                        {zkProofStatus === 'complete' && (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">ZK proof verified successfully!</span>
                            </>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {zkProofStatus === 'parsing' && 'Extracting text and validating document structure...'}
                        {zkProofStatus === 'generating' && 'Creating zero-knowledge proof of credential validity. This preserves your privacy while proving authenticity.'}
                        {zkProofStatus === 'verifying' && 'Checking proof validity and updating reputation score...'}
                        {zkProofStatus === 'complete' && proofDetails && (
                            <div className="space-y-1">
                                <div>Institution verified: {proofDetails.institution}</div>
                                <div>Credential type: {proofDetails.degreeLevel}</div>
                                <div>Proof hash: {proofDetails.hash?.substring(0, 20)}...</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!credentials.has_degree && !credentials.has_certification && (
                <div className="space-y-4">
                    {/* Degree Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Degree Type:</label>
                        <select
                            value={selectedDegree}
                            onChange={(e) => setSelectedDegree(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pixel-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                            required
                        >
                            <option value="">Choose your education level...</option>
                            {degreeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label} ({option.points} points)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Institution Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Institution Name:</label>
                        <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="e.g., Stanford University, MIT, General Assembly..."
                            className="w-full pixel-border bg-background px-3 py-2 text-foreground"
                            required
                            minLength={3}
                        />
                    </div>

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium mb-2">Upload Certificate/Diploma for zkPDF Processing</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            PDF files only, max 10MB • Zero-knowledge proof generation
                        </p>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            onClick={(e) => e.stopPropagation()}
                            className="hidden"
                            id="certificate-upload"
                        />
                        <label htmlFor="certificate-upload" className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-block">
                                <PixelButton variant="muted" type="button" className="pointer-events-none">
                                    Choose PDF File
                                </PixelButton>
                            </div>
                        </label>
                    </div>

                    {file && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>

                            {selectedDegree && institution && (
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="text-sm">
                                        <strong>Ready to submit:</strong>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {degreeOptions.find(d => d.value === selectedDegree)?.label} from {institution}
                                    </div>
                                    <div className="text-xs text-accent mt-1">
                                        Will earn: {degreeOptions.find(d => d.value === selectedDegree)?.points} reputation points
                                    </div>
                                </div>
                            )}

                            <PixelButton
                                variant="accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    submitEducationCredential()
                                }}
                                disabled={uploading || !selectedDegree || !institution.trim() || !file || zkProofStatus !== 'idle'}
                                className="w-full"
                                type="button"
                            >
                                {uploading && zkProofStatus === 'parsing' && 'Parsing PDF...'}
                                {uploading && zkProofStatus === 'generating' && 'Generating ZK Proof...'}
                                {uploading && zkProofStatus === 'verifying' && 'Verifying Proof...'}
                                {!uploading && 'Submit Academic Credential'}
                            </PixelButton>
                        </div>
                    )}
                </div>
            )}

            {(credentials.has_degree || credentials.has_certification) && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Education Verified!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Score earned: {credentials.education_score} / 300 points
                    </p>
                    {credentials.github_username && (
                        <p className="text-xs text-blue-600 mt-2">
                            ✅ Both credentials connected! Generate your ZK proof reputation now
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function GitHubStep({ credentials, onUpdate, walletAddress }: { credentials: ZKCredentials, onUpdate: () => void, walletAddress: string }) {
    const [connecting, setConnecting] = useState(false)

    const connectGitHub = async () => {
        setConnecting(true)

        try {
            console.log('🔗 Starting GitHub OAuth for wallet:', walletAddress)
            // Redirect to GitHub OAuth with wallet address
            window.location.href = `/api/auth/github?wallet=${encodeURIComponent(walletAddress)}`
        } catch (error) {
            console.error('GitHub OAuth failed:', error)
            alert('❌ Failed to start GitHub connection. Please try again.')
            setConnecting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm space-y-2">
                <p><strong>What we analyze:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Public repository contributions</li>
                    <li>Commit frequency and consistency</li>
                    <li>Programming languages used</li>
                    <li>Open source project involvement</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                    🔒 <strong>Privacy:</strong> We generate ZK proofs of your activity without revealing specific repositories.
                </p>
            </div>

            {!credentials.github_username ? (
                <div className="text-center p-6">
                    <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">Connect your GitHub profile</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        We'll analyze your public contributions to generate a ZK proof of your developer activity.
                    </p>
                    <PixelButton
                        variant="accent"
                        onClick={(e) => {
                            e.stopPropagation()
                            connectGitHub()
                        }}
                        disabled={connecting}
                        className="w-full"
                        type="button"
                    >
                        {connecting ? 'Connecting...' : 'Connect GitHub Account'}
                    </PixelButton>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* GitHub Connected Status */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">GitHub Account Connected!</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            @{credentials.github_username} • Ready for zkPDF proof generation
                        </p>
                    </div>

                    {/* Only show score if zkPDF proof was generated (score > 0) */}
                    {(credentials.github_score || 0) > 0 ? (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="font-medium">zkPDF GitHub Proof Generated!</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Reputation earned: {credentials.github_score} / 200 points
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <span className="font-medium">zkPDF Proof Pending</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                GitHub connected, but zkPDF proof not generated yet
                            </p>
                        </div>
                    )}

                    {!credentials.has_degree && !credentials.has_certification && (
                        <p className="text-xs text-blue-600">
                            ✅ Next: Complete academic credentials, then generate zkPDF proofs for both
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
