"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface VerificationData {
  walletAddress: string;
  isVerified: boolean;
  verificationLevel: number;
  votingEligible: boolean;
  demographics: {
    nationality: string | null;
    gender: string | null;
    age: number | null;
  };
  verification: {
    nationality: string;
    gender: string;
    age: number;
    verifiedAt: string;
    txHash: string;
  } | null;
  activeSessions: Array<{
    sessionId: string;
    status: string;
    createdAt: string;
    expiresAt: string;
  }>;
  lastUpdated: string | null;
}

export function VerificationStatus() {
  const { address } = useAccount();
  const router = useRouter();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchVerificationStatus();

      // Set up periodic refresh to catch verification updates
      const interval = setInterval(() => {
        fetchVerificationStatus();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchVerificationStatus = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/self/verification-status?walletAddress=${address}`);
      const data = await response.json();

      if (data.success) {
        setVerificationData(data.data);
      } else {
        setError(data.error || 'Failed to fetch verification status');
      }
    } catch (err) {
      setError('Network error while fetching verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    router.push('/self-verify');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'verifying': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'verifying': return 'Verifying';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3">Loading verification status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchVerificationStatus} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification Status</CardTitle>
        <CardDescription>
          Your Self Protocol verification status and voting eligibility
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verification Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(verificationData?.isVerified ? 'verified' : 'pending')}`}></div>
              <Badge variant={verificationData?.isVerified ? "default" : "secondary"}>
                {verificationData?.isVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
          </div>

          {/* Voting Eligibility */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voting Eligibility</span>
            <Badge variant={verificationData?.votingEligible ? "default" : "secondary"}>
              {verificationData?.votingEligible ? 'Eligible (2x Weight)' : 'Not Eligible'}
            </Badge>
          </div>

          {/* Demographics */}
          {verificationData?.demographics && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Demographics</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-100 p-2 rounded">
                  <div className="font-medium">Nationality</div>
                  <div>{verificationData.demographics.nationality || 'N/A'}</div>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <div className="font-medium">Gender</div>
                  <div>{verificationData.demographics.gender || 'N/A'}</div>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <div className="font-medium">Age</div>
                  <div>{verificationData.demographics.age || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Details */}
          {verificationData?.verification && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Verification Details</span>
              <div className="bg-green-50 p-3 rounded-md text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Verified At:</span>
                    <div>{new Date(verificationData.verification.verifiedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Transaction:</span>
                    <div className="font-mono truncate">{verificationData.verification.txHash}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          {verificationData?.activeSessions && verificationData.activeSessions.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Active Sessions</span>
              {verificationData.activeSessions.map((session) => (
                <div key={session.sessionId} className="bg-yellow-50 p-2 rounded-md text-xs">
                  <div className="flex items-center justify-between">
                    <span>Session: {session.sessionId.substring(0, 8)}...</span>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(session.status)}
                    </Badge>
                  </div>
                  <div className="text-gray-600">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 space-y-2">
            {!verificationData?.isVerified ? (
              <Button onClick={handleStartVerification} className="w-full">
                Start Self Verification
              </Button>
            ) : (
              <Button onClick={handleStartVerification} variant="outline" className="w-full">
                Re-verify Identity
              </Button>
            )}
            <Button onClick={fetchVerificationStatus} variant="ghost" size="sm" className="w-full">
              🔄 Refresh Status
            </Button>
          </div>

          {/* Benefits */}
          {!verificationData?.isVerified && (
            <div className="bg-blue-50 p-3 rounded-md text-xs">
              <div className="font-medium mb-2">Benefits of Verification:</div>
              <ul className="space-y-1 text-gray-700">
                <li>• 2x voting weight in HackerRep</li>
                <li>• Enhanced reputation and trust</li>
                <li>• Access to exclusive features</li>
                <li>• On-chain identity verification</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
