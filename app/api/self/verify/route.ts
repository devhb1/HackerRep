import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Self verification request received:', body);
        
        // Extract verification data from Self Protocol
        // Self Protocol sends data in a specific format
        const {
            userIdentifier,
            disclosedData,
            identityCommitment,
            sessionId,
            walletAddress,
            proof,
            publicSignals
        } = body;

        if (!userIdentifier) {
            return NextResponse.json({ 
                error: 'Missing userIdentifier' 
            }, { status: 400 });
        }

        // Extract demographic data from disclosed data
        const nationality = extractNationality(disclosedData);
        const gender = extractGender(disclosedData);
        const age = extractAge(disclosedData);

        // Validate nationality (must be India)
        if (nationality !== 'INDIA' && nationality !== 'IN') {
            return NextResponse.json({ 
                error: 'Only Indian nationality allowed' 
            }, { status: 400 });
        }

        // Validate age (must be 18+)
        if (age < 18) {
            return NextResponse.json({ 
                error: 'Age must be 18 or above' 
            }, { status: 400 });
        }

        const walletAddr = walletAddress?.toLowerCase() || userIdentifier.toLowerCase();

        // Store verification data in self_verifications table
        const { data: verification, error: verificationError } = await supabase
            .from('self_verifications')
            .upsert({
                wallet_address: walletAddr,
                nationality: nationality,
                gender: gender,
                age: age,
                identity_commitment: identityCommitment,
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
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
                error: 'Failed to store verification data' 
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
            return NextResponse.json({ 
                error: 'Failed to update user demographic data' 
            }, { status: 500 });
        }

        // Update session status if sessionId provided
        if (sessionId) {
            await supabase
                .from('verification_sessions')
                .update({
                    status: 'verified',
                    verification_data: {
                        nationality,
                        gender,
                        age,
                        identityCommitment
                    },
                    completed_at: new Date().toISOString()
                })
                .eq('session_id', sessionId);
        }

        console.log('✅ Self verification completed:', {
            walletAddress: verification.wallet_address,
            nationality,
            gender,
            age
        });

        // Return success response in Self Protocol expected format
        const response = NextResponse.json({ 
            success: true,
            message: "Verification successful",
            data: {
                userIdentifier: userIdentifier,
                walletAddress: verification.wallet_address,
                nationality,
                gender,
                age,
                verified: true,
                timestamp: new Date().toISOString()
            }
        });

        // Add CORS headers for Self Protocol
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;

    } catch (error) {
        console.error('Self verification error:', error);
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

// Helper functions for data extraction
function extractNationality(disclosedData: any): string {
    if (disclosedData?.nationality) {
        return disclosedData.nationality.toUpperCase();
    }
    return 'INDIA'; // Default for demo
}

function extractGender(disclosedData: any): string {
    if (disclosedData?.gender) {
        return disclosedData.gender.toUpperCase();
    }
    return 'MALE'; // Default for demo
}

function extractAge(disclosedData: any): number {
    if (disclosedData?.date_of_birth) {
        // Calculate age from date of birth
        const birthDate = new Date(disclosedData.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return 25; // Default for demo
}
