import { NextRequest, NextResponse } from 'next/server'
import { generateAcademicZKProof, verifyZKProof } from '@/lib/zkpdf-reputation'

// POST /api/zk-proofs/generate - Generate ZK proof for academic credentials
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const certificate = formData.get('certificate') as File
        const degreeType = formData.get('degreeType') as string
        const institution = formData.get('institution') as string
        const walletAddress = formData.get('walletAddress') as string

        if (!certificate || !degreeType || !institution || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate file type
        if (certificate.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            )
        }

        // Validate file size (10MB limit)
        if (certificate.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 10MB' },
                { status: 400 }
            )
        }

        // Generate ZK proof for academic credentials
        console.log('🎓 Generating zkPDF academic proof...')
        const fileBuffer = await certificate.arrayBuffer()

        const zkProof = await generateAcademicZKProof(
            walletAddress,
            degreeType as 'bachelors' | 'masters' | 'phd' | 'highschool' | 'certification',
            institution,
            fileBuffer
        )

        // Verify the proof
        const isValid = await verifyZKProof(zkProof)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Generated ZK proof is invalid' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `🎓 zkPDF academic proof generated! ${zkProof.score} reputation points earned.`,
            proof: {
                proofId: zkProof.proofId,
                proofType: zkProof.proofType,
                commitment: zkProof.commitment,
                nullifier: zkProof.nullifier,
                score: zkProof.score,
                verified: zkProof.verified,
                createdAt: zkProof.createdAt,
                expiresAt: zkProof.expiresAt
            },
            scoreAwarded: zkProof.score,
            degreeType,
            institution
        })

    } catch (error) {
        console.error('Academic ZK proof generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate ZK proof' },
            { status: 500 }
        )
    }
}