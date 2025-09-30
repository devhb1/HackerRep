import { NextRequest, NextResponse } from 'next/server';
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Use service role key for backend operations to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

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

// Initialize Self Protocol backend verifier for CELO MAINNET ONCHAIN VERIFICATION
const selfBackendVerifier = new SelfBackendVerifier(
    "hackerrep-verification-v1", // Simplified scope for Self Protocol SDK compatibility
    "https://hacker-rep.vercel.app/api/self/verify", // Always use production URL to avoid auth protection
    false, // mockPassport: false for CELO MAINNET PRODUCTION
    AllIds, // Accept all document types (passport, ID, Aadhaar)
    new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [], // Empty - filter in contract logic for India-only
        ofac: false, // Let contract handle nationality validation
    }),
    "hex" // userIdentifierType: "hex" for SMART CONTRACT integration with wallet addresses
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        logger.info('Self verification request received', { hasProof: !!body.proof, hasPublicSignals: !!body.publicSignals }, 'VERIFICATION');

        // Extract data according to Self Protocol format
        const { attestationId, proof, publicSignals, userContextData } = body;

        // Verify all required fields are present
        if (!proof || !publicSignals || !attestationId || !userContextData) {
            return NextResponse.json({
                message: "Proof, publicSignals, attestationId and userContextData are required",
                status: "error",
                result: false,
                error_code: "MISSING_FIELDS"
            }, { status: 200 });
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
                }, { status: 200 });
            }

            // Extract wallet address from userContextData (hex string)
            const walletAddr = userContextData?.toLowerCase();
            logger.info('Processing Self verification for wallet', { walletAddress: walletAddr }, 'VERIFICATION');

            // Store verification data in self_verifications table (using service role to bypass RLS)
            // First check if verification already exists
            const { data: existingVerification } = await supabaseAdmin
                .from('self_verifications')
                .select('id')
                .eq('wallet_address', walletAddr)
                .single();

            let verification, verificationError;

            if (existingVerification) {
                // Update existing verification
                const { data, error } = await supabaseAdmin
                    .from('self_verifications')
                    .update({
                        nationality: nationality,
                        gender: gender,
                        age: age,
                        verification_status: 'verified',
                        verified_at: new Date().toISOString(),
                        identity_commitment: attestationId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('wallet_address', walletAddr)
                    .select()
                    .single();
                verification = data;
                verificationError = error;
            } else {
                // Insert new verification
                const { data, error } = await supabaseAdmin
                    .from('self_verifications')
                    .insert({
                        wallet_address: walletAddr,
                        nationality: nationality,
                        gender: gender,
                        age: age,
                        verification_status: 'verified',
                        verified_at: new Date().toISOString(),
                        identity_commitment: attestationId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                verification = data;
                verificationError = error;
            }

            if (verificationError) {
                logger.error('Error storing verification', {
                    code: verificationError.code,
                    message: verificationError.message,
                    details: verificationError.details,
                    hint: verificationError.hint,
                    walletAddress: walletAddr
                }, 'VERIFICATION');
                return NextResponse.json({
                    status: "error",
                    result: false,
                    reason: `Failed to store verification data: ${verificationError.message}`,
                    error_code: "DATABASE_ERROR",
                    details: verificationError
                }, { status: 200 });
            }

            // Check if user exists, create if not, update if exists
            const { data: existingUser, error: fetchUserError } = await supabaseAdmin
                .from('users')
                .select('id, wallet_address')
                .eq('wallet_address', walletAddr)
                .single();

            if (fetchUserError && fetchUserError.code !== 'PGRST116') {
                logger.error('Error checking existing user', { error: fetchUserError, walletAddress: walletAddr }, 'VERIFICATION');
                // Continue anyway
            }

            let userError: Error | null = null;

            if (!existingUser) {
                // Create new user with demographic data and verification status
                const { error: createUserError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        wallet_address: walletAddr,
                        display_name: `User ${walletAddr.substring(0, 6)}...${walletAddr.substring(walletAddr.length - 4)}`,
                        nationality: nationality,
                        gender: gender,
                        age: age,
                        self_verified: true,
                        verification_level: 3, // Level 3 = Self Protocol verified
                        voting_eligible: nationality === 'INDIA', // Only Indian users can vote
                        reputation_score: 100, // Base reputation for verified users
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                userError = createUserError;
                if (!createUserError) {
                    logger.info('Created new user with Self verification data', { walletAddress: walletAddr, nationality }, 'VERIFICATION');
                }
            } else {
                // Update existing user with demographic data and verification status
                const { error: updateUserError } = await supabaseAdmin
                    .from('users')
                    .update({
                        nationality: nationality,
                        gender: gender,
                        age: age,
                        self_verified: true,
                        verification_level: 3, // Level 3 = Self Protocol verified
                        voting_eligible: nationality === 'INDIA', // Only Indian users can vote
                        updated_at: new Date().toISOString()
                    })
                    .eq('wallet_address', walletAddr);

                userError = updateUserError;
                if (!updateUserError) {
                    logger.info('Updated existing user with Self verification data', { walletAddress: walletAddr, nationality }, 'VERIFICATION');
                }
            }

            if (userError) {
                logger.error('Error managing user demographics', { error: userError, walletAddress: walletAddr }, 'VERIFICATION');
                // This is actually critical - we should return an error if user update fails
                return NextResponse.json({
                    status: "error",
                    result: false,
                    reason: "Verification succeeded but failed to update user record",
                    error_code: "USER_UPDATE_FAILED",
                    details: userError.message,
                    // Still return success for Self Protocol, but indicate the sync issue
                    verification_status: "verified_but_sync_failed"
                }, { status: 200 });
            }

            logger.info('Self verification successful', {
                walletAddress: walletAddr,
                nationality,
                gender,
                age,
                attestationId
            }, 'VERIFICATION');

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
            logger.error('Self Protocol verification failed', { validationDetails: result.isValidDetails }, 'VERIFICATION');
            return NextResponse.json({
                status: "error",
                result: false,
                reason: "Verification failed",
                error_code: "VERIFICATION_FAILED",
                details: result.isValidDetails,
            }, { status: 200 });
        }

    } catch (error) {
        logger.error('Self verification error', { error: error instanceof Error ? error.message : error }, 'VERIFICATION');
        return NextResponse.json({
            status: "error",
            result: false,
            reason: error instanceof Error ? error.message : "Unknown error",
            error_code: "UNKNOWN_ERROR"
        }, { status: 200 });
    }
}


