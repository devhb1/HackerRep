"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
  countries,
  getUniversalLink,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SelfVerifyPage() {
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId, setUserId] = useState(ethers.ZeroAddress);
  const [isLoading, setIsLoading] = useState(true);

  // For HackerRep, we want to allow India only
  const excludedCountries = useMemo(() => {
    const allCountries = Object.values(countries);
    return allCountries.filter(country => country !== countries.INDIA);
  }, []);

  // Initialize Self App
  useEffect(() => {
    const initializeSelfApp = async () => {
      try {
        setIsLoading(true);
        
        // Get user's wallet address (you can integrate with your wallet connection)
        const userWalletAddress = userId || ethers.ZeroAddress;
        
        const app = new SelfAppBuilder({
          version: 2,
          appName: "HackerRep Identity Verification",
          scope: "hackerrep-verification",
          endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'http://localhost:3000'}/api/self/verify`,
          logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
          userId: userWalletAddress,
          endpointType: "celo",
          userIdType: "hex",
          userDefinedData: JSON.stringify({
            walletAddress: userWalletAddress,
            timestamp: Date.now(),
            source: "hacker-rep",
            contractAddress: "0x5821173b323022dFc1549Be1a6Dee657997Ec5Db"
          }),
          disclosures: {
            excludedCountries: excludedCountries,
            nationality: true,
            date_of_birth: true,
            gender: true,
          }
        }).build();

        setSelfApp(app);
        setUniversalLink(getUniversalLink(app));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeSelfApp();
    }
  }, [excludedCountries, userId]);

  // Simulate wallet connection (replace with your actual wallet connection)
  useEffect(() => {
    // For demo purposes, use a sample wallet address
    // In production, this would come from your wallet connection
    const sampleWallet = "0xd1c9BD2a14b00C99803B5Ded4571814D227566C7";
    setUserId(sampleWallet);
  }, []);

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
        console.error("Failed to copy text: ", err);
        displayToast("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink) return;

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
          walletAddress: userId,
          source: 'hacker-rep-self-verify',
          timestamp: Date.now(),
          contractAddress: "0x5821173b323022dFc1549Be1a6Dee657997Ec5Db",
          chainId: 42220,
          demographics: {
            nationality: "INDIA",
            gender: "MALE",
            age: 25
          }
        })
      });

      if (response.ok) {
        displayToast("✅ Successfully verified! You can now vote with enhanced power!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        throw new Error('Failed to sync with HackerRep');
      }
    } catch (error) {
      console.error('Failed to sync verification:', error);
      displayToast("Verification successful but sync failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Self verification...</p>
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
      </div>

      {/* Main content */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="flex justify-center mb-4 sm:mb-6">
          {selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={() => {
                displayToast("Error: Failed to verify identity");
              }}
            />
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
            {userId && userId !== ethers.ZeroAddress ? userId : <span className="text-gray-400">Connecting wallet...</span>}
          </div>
          {userId && userId !== ethers.ZeroAddress && (
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
