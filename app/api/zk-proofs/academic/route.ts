import { NextRequest, NextResponse } from 'next/server'
import { generateAcademicZKPDFProof, verifyZKPDFProof } from '@/lib/zkpdf-integration'

// POST /api/zk-proofs/academic - Generate OFFICIAL zkPDF proof for academic credentials
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

        // Validate file type (be more lenient with PDF detection)
        if (certificate.type !== 'application/pdf' && !certificate.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Only PDF files are allowed for zkPDF verification', details: `Received file type: ${certificate.type}, name: ${certificate.name}` },
                { status: 400 }
            )
        }

        // Validate file size (10MB limit)
        if (certificate.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 10MB', details: `Received file size: ${(certificate.size / 1024 / 1024).toFixed(2)}MB` },
                { status: 400 }
            )
        }

        // Validate required fields
        if (!walletAddress || walletAddress.length !== 42 || !walletAddress.startsWith('0x')) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            )
        }

        if (!degreeType || !institution || institution.trim().length < 3) {
            return NextResponse.json(
                { error: 'Invalid degree type or institution name' },
                { status: 400 }
            )
        }

        // 🏆 ETHEREUM FOUNDATION: Generate zkPDF proof (simplified for demo)
        console.log('🎓 Generating zkPDF academic proof based on degree type...')

        // For hackathon demo: Accept any PDF and award points based on degree selection
        console.log(`📄 PDF uploaded: ${certificate.name} (${(certificate.size / 1024).toFixed(2)} KB)`)
        console.log(`🎯 Degree type: ${degreeType}, Institution: ${institution}`)

        const fileBuffer = await certificate.arrayBuffer()

        const zkpdfProof = await generateAcademicZKPDFProof(
            walletAddress,
            degreeType as 'bachelors' | 'masters' | 'phd' | 'highschool' | 'certification',
            institution,
            fileBuffer
        )

        // Verify the zkPDF proof
        const isValid = await verifyZKPDFProof(zkpdfProof)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Generated zkPDF proof is invalid' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `🎓 Academic zkPDF Proof Generated! ${zkpdfProof.reputationScore} reputation points earned.`,
            scoreAwarded: zkpdfProof.reputationScore,
            zkpdfProof: {
                proofId: zkpdfProof.proofId,
                proofType: zkpdfProof.proofType,
                reputationScore: zkpdfProof.reputationScore,
                verified: zkpdfProof.verified
            },
            degreeType,
            institution,
            zkpdfGenerated: true
        })

    } catch (error) {
        console.error('zkPDF academic proof generation error:', error)

        // Log more details for debugging
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }

        return NextResponse.json(
            {
                error: 'Failed to generate zkPDF proof for academic credential',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}