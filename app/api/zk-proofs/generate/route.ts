import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/zk-proofs/generate - Generate ZK proof for education credentials
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

        // Generate file hash for verification
        const fileBuffer = await certificate.arrayBuffer()
        const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex')

        // For MVP, we'll simulate ZK proof generation
        // In production, this would use zkPDF library for actual verification
        const zkProofHash = crypto.createHash('sha256')
            .update(`${walletAddress}:${degreeType}:${institution}:${fileHash}:${Date.now()}`)
            .digest('hex')

        // Store the credential upload record
        const { data: uploadRecord, error: uploadError } = await supabase
            .from('credential_uploads')
            .insert({
                wallet_address: walletAddress.toLowerCase(),
                upload_type: 'education_certificate',
                file_hash: fileHash,
                zk_proof_hash: zkProofHash,
                verification_status: 'verified', // For MVP, auto-verify
                score_awarded: getScoreForDegreeType(degreeType),
                metadata: JSON.stringify({
                    degreeType,
                    institution,
                    fileName: certificate.name,
                    fileSize: certificate.size,
                    uploadedAt: new Date().toISOString()
                })
            })
            .select()
            .single()

        if (uploadError) {
            console.error('Failed to store credential upload:', uploadError)
            return NextResponse.json(
                { error: 'Failed to store credential' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            fileHash,
            zkProofHash,
            scoreAwarded: getScoreForDegreeType(degreeType),
            uploadId: uploadRecord.id
        })

    } catch (error) {
        console.error('ZK proof generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate ZK proof' },
            { status: 500 }
        )
    }
}

function getScoreForDegreeType(degreeType: string): number {
    const scores: Record<string, number> = {
        'high_school': 50,
        'bachelors': 150,
        'masters': 200,
        'phd': 250,
        'certification': 100,
        'bootcamp': 75
    }
    return scores[degreeType] || 0
}