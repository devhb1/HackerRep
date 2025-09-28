import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";
import { supabase } from '@/lib/supabase';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// Initialize Self Protocol backend verifier
const selfBackendVerifier = new SelfBackendVerifier(
    "hacker-rep-verification", // Must match frontend scope
    "https://hacker-rep.vercel.app/api/self/verify", // Always use production URL to avoid auth protection
    false, // mockPassport: false for production, true for testing
    AllIds, // Accept all document types
    new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [], // Empty array - let all countries through, filter in app logic
        ofac: false, // Disable OFAC for demo (India isn't sanctioned)
    }),
    "uuid" // userIdentifierType - must match docs example
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Self verification request received:', body);

        // Extract data according to Self Protocol format
        const { attestationId, proof, publicSignals, userContextData } = body;

        // Verify all required fields are present
        if (!proof || !publicSignals || !attestationId || !userContextData) {
            return NextResponse.json({
                message: "Proof, publicSignals, attestationId and userContextData are required",
                status: "error",
                result: false,
                error_code: "MISSING_FIELDS"
            }, { status: 400 });
        }

        // Use official Self Protocol backend verifier
        const result = await selfBackendVerifier.verify(
            attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
            proof,            // The zero-knowledge proof
            publicSignals,    // Public signals array
            userContextData   // User context data (hex string)
        );

        // Check if verification was successful
        if (result.isValidDetails.isValid) {
            // Extract demographic data from Self Protocol result
            const disclosedData = result.discloseOutput;
            const nationality = disclosedData?.nationality || 'INDIA';
            const gender = disclosedData?.gender || 'UNKNOWN';
            const age = disclosedData?.minimumAge || 18;

            // Validate nationality (must be India for this app)
            if (nationality !== 'INDIA' && nationality !== 'IN' && nationality !== 'IND') {
                return NextResponse.json({
                    status: "error",
                    result: false,
                    reason: "Only Indian nationality allowed for HackerRep verification",
                    error_code: "INVALID_NATIONALITY"
                }, { status: 400 });
            }

            // Extract wallet address from userContextData (hex string)
            const walletAddr = userContextData?.toLowerCase();

            // Store verification data in self_verifications table
            const { data: verification, error: verificationError } = await supabase
                .from('self_verifications')
                .upsert({
                    wallet_address: walletAddr,
                    nationality: nationality,
                    gender: gender,
                    age: age,
                    verification_status: 'verified',
                    verified_at: new Date().toISOString(),
                    attestation_id: attestationId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'wallet_address'
                })
                .select()
                .single();

            if (verificationError) {
                console.error('Error storing verification:', verificationError);
                return NextResponse.json({
                    status: "error",
                    result: false,
                    reason: 'Failed to store verification data',
                    error_code: "DATABASE_ERROR"
                }, { status: 500 });
            }

            // Update users table with demographic data and verification status
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    nationality: nationality,
                    gender: gender,
                    age: age,
                    self_verified: true,
                    verification_level: 3, // Level 3 = Self Protocol verified
                    voting_eligible: true,
                    updated_at: new Date().toISOString()
                })
                .eq('wallet_address', walletAddr);

            if (userUpdateError) {
                console.error('Error updating user demographics:', userUpdateError);
                // Don't fail the verification for this error
            }

            console.log('✅ Self verification successful:', {
                walletAddress: walletAddr,
                nationality,
                gender,
                age,
                attestationId
            });

            // Return success response in Self Protocol expected format
            const response = NextResponse.json({
                status: "success",
                result: true,
                credentialSubject: result.discloseOutput,
                message: "Verification successful",
                data: {
                    walletAddress: walletAddr,
                    nationality,
                    gender,
                    age,
                    verified: true,
                    timestamp: new Date().toISOString()
                }
            });

            // Add CORS headers
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return response;

        } else {
            // Verification failed
            console.error('Self Protocol verification failed:', result.isValidDetails);
            return NextResponse.json({
                status: "error",
                result: false,
                reason: "Verification failed",
                error_code: "VERIFICATION_FAILED",
                details: result.isValidDetails,
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Self verification error:', error);
        return NextResponse.json({
            status: "error",
            result: false,
            reason: error instanceof Error ? error.message : "Unknown error",
            error_code: "UNKNOWN_ERROR"
        }, { status: 500 });
    }
}


