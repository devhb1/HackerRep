"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
  countries,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function SelfVerifyPage() {
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // For HackerRep, we want to allow India only
  const excludedCountries = useMemo(() => {
    const allCountries = Object.values(countries);
    return allCountries.filter(country => country !== countries.INDIA);
  }, []);

  // Handle client-side mounting and get wallet address
  useEffect(() => {
    setMounted(true);

    // Only run on client side
    if (typeof window === 'undefined') return;

    // Get wallet address from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const addressFromUrl = urlParams.get('address');
    const addressFromStorage = localStorage.getItem('walletAddress');
    let address = addressFromUrl || addressFromStorage || '0xd1c9BD2a14b00C99803B5Ded4571814D227566C7';

    // Ensure address is in proper format (checksummed)
    if (address && ethers.isAddress(address)) {
      address = ethers.getAddress(address); // This normalizes the address
    }

    setWalletAddress(address);
  }, []);

  // Initialize Self App
  useEffect(() => {
    if (!mounted || !walletAddress) return;

    const initializeSelfApp = async () => {
      // Reset error state on retry
      if (retryCount > 0) {
        setError(null);
      }
      try {
        setIsLoading(true);
        logger.info("Starting Self App initialization...", { walletAddress }, "VERIFICATION");

        // Create a robust Self App configuration with better error handling
        // Use production URL to avoid Vercel deployment protection on preview branches
        const baseUrl = 'https://hacker-rep.vercel.app'; // Always use production to avoid auth issues

        // Self Protocol expects the endpoint without /api prefix
        const endpoint = `${baseUrl}/api/self/verify`;

        logger.info("Self App configuration", {
          endpoint,
          walletAddress,
          baseUrl,
          endpointType: "https (Celo mainnet)"
        }, "VERIFICATION");

        // Validate endpoint URL
        try {
          new URL(endpoint);
          logger.info("Endpoint URL validated successfully", { endpoint }, "VERIFICATION");
        } catch (urlError) {
          const errorMessage = `Invalid endpoint URL: ${endpoint}`;
          logger.error("Invalid endpoint URL", { endpoint, error: urlError }, "VERIFICATION");
          throw new Error(errorMessage);
        }

        const config = {
          version: 2,
          appName: "HackerRep",
          scope: "hacker-rep-verification",
          endpoint: endpoint,
          userId: walletAddress,
          endpointType: "https",
          userIdType: "hex"
        };

        logger.info("Creating SelfAppBuilder", { config }, "VERIFICATION");

        const app = new SelfAppBuilder({
          version: 2,
          appName: "HackerRep",
          scope: "hackerrep-verification-v1", // Simplified scope for Self Protocol SDK compatibility
          endpoint: endpoint,
          userId: walletAddress, // Wallet address for onchain verification
          endpointType: "https", // Use "https" for production Celo mainnet
          userIdType: "hex", // "hex" for wallet addresses onchain
          userDefinedData: walletAddress, // Wallet address as user context for contract
          disclosures: {
            minimumAge: 18, // Must match backend config
            excludedCountries: [], // Empty - let contract handle India validation
            ofac: false, // Let contract handle nationality filtering
            nationality: true,
            gender: true,
          }
        }).build();

        // Add a small delay to ensure proper initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        logger.info("Self App created successfully", { universalLinkGenerated: !!app }, "VERIFICATION");
        setSelfApp(app);

        const universalLink = getUniversalLink(app);
        logger.info("Universal link generated successfully", { linkLength: universalLink.length }, "VERIFICATION");
        setUniversalLink(universalLink);

        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error("Failed to initialize Self app", { error: errorMessage }, "VERIFICATION");
        setError(`Self App initialization failed: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    // Add timeout to prevent hanging - only for initialization, not for QR code scanning
    const timeoutId = setTimeout(() => {
      if (isLoading && !selfApp) {
        logger.error("Self App initialization timed out", null, "VERIFICATION");
        setError("QR Code Loading Failed - Self App initialization timed out. Please try again.");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout for initialization only

    initializeSelfApp();

    return () => clearTimeout(timeoutId);
  }, [excludedCountries, walletAddress, mounted, retryCount]);

  const retryInitialization = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = () => {
    if (!universalLink) return;

    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        displayToast("Universal link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        logger.error("Failed to copy text to clipboard", { error: err instanceof Error ? err.message : err }, "VERIFICATION");
        displayToast("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink || typeof window === 'undefined') return;

    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  const handleSuccessfulVerification = async () => {
    displayToast("Verification successful! Syncing with HackerRep...");

    try {
      // Sync verification data with HackerRep API
      const response = await fetch('/api/self/sync-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          source: 'hacker-rep-self-verify',
          timestamp: Date.now(),
          contractAddress: "0xF54C11EbC39905dd88496E098CDEeC565F79a696", // Updated to correct contract
          chainId: 42220,
          demographics: {
            nationality: "INDIA",
            gender: "MALE",
            age: 25
          }
        })
      });

      if (response.ok) {
        displayToast("✅ Verification synced! Checking voting status...");

        // Wait a moment for database updates to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh verification status to confirm user can vote
        const statusResponse = await fetch(`/api/self/verification-status?walletAddress=${walletAddress}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data.votingEligible) {
            displayToast("🎉 SUCCESS! You can now vote with enhanced power!");
          } else {
            displayToast("⚠️ Verified but voting eligibility pending. Please refresh in a moment.");
          }
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to sync with HackerRep: ${errorText}`);
      }
    } catch (error) {
      logger.error('Failed to sync verification', { error: error instanceof Error ? error.message : error }, "VERIFICATION");
      displayToast("Verification successful but sync failed. Please try refreshing the page.");

      // Still redirect to dashboard after delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Wallet Not Connected</CardTitle>
            <CardDescription className="text-center">
              Please connect your wallet to proceed with Self Protocol verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Self verification...</p>
          <p className="text-sm text-gray-500 mt-2">Wallet: {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">QR Code Loading Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={retryInitialization}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry ({retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Try Again'})
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
          HackerRep Identity Verification
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Verify your Indian identity to unlock enhanced voting privileges
        </p>
        <p className="text-xs text-gray-500 px-2 mt-1">
          🇮🇳 India only • Enhanced voting power • On-chain verification
        </p>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium">
            ⚠️ Voting Requirement: Self Protocol verification is MANDATORY for voting
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Only verified Indian users can participate in the voting system
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="flex justify-center mb-4 sm:mb-6">
          {selfApp ? (
            <div className="text-center">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccessfulVerification}
                onError={(error) => {
                  logger.error("Self Protocol verification error", { error: error instanceof Error ? error.message : error }, "VERIFICATION");
                  displayToast("Error: Failed to verify identity. Please try again.");
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                Scan with Self App to verify your identity
              </p>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <p className="text-gray-600">Wallet: {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}</p>
                <p className="text-gray-600">App Status: {selfApp ? '✅ Ready' : '⏳ Loading'}</p>
                <p className="text-gray-600">Link: {universalLink ? '✅ Generated' : '⏳ Generating'}</p>
                <p className="text-gray-600">Retry Count: {retryCount}</p>
              </div>
            </div>
          ) : (
            <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse flex items-center justify-center">
              <p className="text-gray-500 text-sm">Loading QR Code...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mb-4 sm:mb-6">
          <Button
            onClick={copyToClipboard}
            disabled={!universalLink}
            className="flex-1"
          >
            {linkCopied ? "Copied!" : "Copy Link"}
          </Button>

          <Button
            onClick={openSelfApp}
            disabled={!universalLink}
            variant="outline"
            className="flex-1 mt-2 sm:mt-0"
          >
            Open Self App
          </Button>
        </div>


        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-gray-500 text-xs uppercase tracking-wide">Your Wallet Address</span>
          <div className="bg-gray-100 rounded-md px-3 py-2 w-full text-center break-all text-sm font-mono text-gray-800 border border-gray-200">
            {walletAddress && walletAddress !== ethers.ZeroAddress ? walletAddress : <span className="text-gray-400">Connecting wallet...</span>}
          </div>
          {walletAddress && walletAddress !== ethers.ZeroAddress && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Ready for verification
            </p>
          )}
        </div>

        {/* Benefits */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Verification Benefits</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">2x</Badge>
                <span>Enhanced voting weight</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">🇮🇳</Badge>
                <span>Indian nationality verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">🔒</Badge>
                <span>On-chain verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toast notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg animate-fade-in text-sm">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card className="mt-6 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">How to Verify</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <p className="font-medium">Scan QR Code</p>
                <p className="text-gray-600">Use the Self app to scan the QR code above</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <p className="font-medium">Verify Identity</p>
                <p className="text-gray-600">Complete identity verification in Self app</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <p className="font-medium">Get Enhanced Voting</p>
                <p className="text-gray-600">Your voting power will be doubled automatically</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
