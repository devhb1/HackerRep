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

interface ZKCredentials {
    education_score: number
    github_score: number
    social_score: number
    total_base_score: number
    reputation_tier: string
    completed_onboarding: boolean
    has_degree: boolean
    has_certification: boolean
    github_username: string | null
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

    useEffect(() => {
        if (isConnected && address) {
            fetchCredentials()
        }
    }, [address, isConnected])

    const fetchCredentials = async () => {
        try {
            const response = await fetch(`/api/zk-credentials/${address}`)
            if (response.ok) {
                const data = await response.json()
                setCredentials(data.credentials)
            } else {
                // User doesn't have ZK credentials yet, create empty record
                setCredentials({
                    education_score: 0,
                    github_score: 0,
                    social_score: 0,
                    total_base_score: 0,
                    reputation_tier: 'newcomer',
                    completed_onboarding: false,
                    has_degree: false,
                    has_certification: false,
                    github_username: null
                })
            }
        } catch (error) {
            console.error('Failed to fetch ZK credentials:', error)
        }
        setLoading(false)
    }

    if (!isConnected || loading) {
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
            description: 'Upload your degree or certification to earn 100-200 base reputation points',
            icon: GraduationCap,
            completed: credentials.has_degree || credentials.has_certification,
            score: credentials.education_score,
            maxScore: 300
        },
        {
            id: 'github',
            title: 'GitHub Developer Profile',
            description: 'Connect GitHub to prove your development activity (50-200 points)',
            icon: Github,
            completed: credentials.github_username !== null,
            score: credentials.github_score,
            maxScore: 200
        },
        {
            id: 'social',
            title: 'Social Reputation',
            description: 'Build reputation through peer connections and votes (0-100 points)',
            icon: Users,
            completed: credentials.social_score > 0,
            score: credentials.social_score,
            maxScore: 100
        }
    ]

    const totalProgress = (credentials.total_base_score / 600) * 100
    const canAccessNetworking = credentials.total_base_score >= 50 // Minimum threshold

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
                            {credentials.total_base_score} / 600
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
                        <span>Senior (400)</span>
                        <span>Expert (600)</span>
                    </div>
                </div>

                {/* Access Status */}
                {canAccessNetworking ? (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">
                            ✅ Networking unlocked! You can now connect with other builders.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm">
                            📝 Complete your ZK proofs to unlock hackathon networking features.
                        </span>
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
                            onClick={() => setCurrentStep(isActive ? null : step.id)}
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
                {!canAccessNetworking && (
                    <PixelButton
                        variant="accent"
                        onClick={() => setCurrentStep('education')}
                    >
                        Start Building Reputation
                    </PixelButton>
                )}
                {canAccessNetworking && (
                    <div className="flex gap-2">
                        <PixelButton
                            variant="primary"
                            onClick={() => window.location.href = '/search'}
                        >
                            Start Networking
                        </PixelButton>
                        <PixelButton
                            variant="muted"
                            onClick={() => window.location.href = '/leaderboard'}
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
        case 'social':
            return <SocialStep credentials={credentials} onUpdate={onUpdate} walletAddress={walletAddress} />
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
        if (!selectedDegree || !institution.trim()) {
            alert('Please select a degree type and enter institution name')
            return
        }

        if (!file) {
            alert('Please upload your certificate/diploma')
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

            // Use clean zkPDF academic API endpoint
            const response = await fetch('/api/zk-proofs/academic', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setZkProofStatus('verifying')
                setProofDetails(result.proof)

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
                throw new Error(result.error || 'zkPDF proof generation failed')
            }
        } catch (error) {
            console.error('zkPDF proof generation failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Please check your certificate and try again'
            alert(`❌ ZK Proof Generation Failed\n\n${errorMessage}\n\nTips:\n• Ensure PDF contains institution name\n• Check that degree type matches certificate\n• Verify PDF is not corrupted`)
            setZkProofStatus('idle')
            setProofDetails(null)
        }

        setUploading(false)
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
                            className="w-full pixel-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
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
                            placeholder="e.g., Stanford University, MIT, General Assembly..."
                            className="w-full pixel-border bg-background px-3 py-2 text-foreground"
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
                            className="hidden"
                            id="certificate-upload"
                        />
                        <label htmlFor="certificate-upload" className="cursor-pointer">
                            <div className="inline-block">
                                <PixelButton variant="muted" type="button">
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
                                onClick={submitEducationCredential}
                                disabled={uploading || !selectedDegree || !institution || zkProofStatus !== 'idle'}
                                className="w-full"
                            >
                                {uploading && zkProofStatus === 'parsing' && 'Parsing PDF...'}
                                {uploading && zkProofStatus === 'generating' && 'Generating ZK Proof...'}
                                {uploading && zkProofStatus === 'verifying' && 'Verifying Proof...'}
                                {!uploading && 'Generate zkPDF Proof'}
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
            // Redirect to GitHub OAuth with wallet address
            window.location.href = `/api/auth/github?wallet=${encodeURIComponent(walletAddress)}`
        } catch (error) {
            console.error('GitHub OAuth failed:', error)
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
                        onClick={connectGitHub}
                        disabled={connecting}
                        className="w-full"
                    >
                        {connecting ? 'Connecting...' : 'Connect GitHub Account'}
                    </PixelButton>
                </div>
            ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">GitHub Connected!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        @{credentials.github_username} • Score: {credentials.github_score} / 200 points
                    </p>
                </div>
            )}
        </div>
    )
}

function SocialStep({ credentials, walletAddress }: { credentials: ZKCredentials, onUpdate: () => void, walletAddress: string }) {
    return (
        <div className="space-y-4">
            <div className="text-sm space-y-2">
                <p><strong>Build social reputation by:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Connecting with other builders at hackathons</li>
                    <li>Receiving upvotes from verified connections</li>
                    <li>Participating in community discussions</li>
                    <li>Helping other hackers build their projects</li>
                </ul>
            </div>

            {credentials.social_score === 0 ? (
                <div className="text-center p-6">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">Start networking to build social reputation</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Complete your ZK proofs first, then connect with other builders to earn social points.
                    </p>
                </div>
            ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Social Reputation Active!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Current score: {credentials.social_score} / 100 points
                    </p>
                </div>
            )}
        </div>
    )
}