"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SelfIntegrationPage() {
  const [listenerStatus, setListenerStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [contractInfo, setContractInfo] = useState<any>(null);

  const contractAddress = '0x5821173b323022dFc1549Be1a6Dee657997Ec5Db';
  const celoscanUrl = `https://celoscan.io/address/${contractAddress}`;

  const startEventListener = async () => {
    setListenerStatus('starting');
    try {
      const response = await fetch('/api/contract/listen-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setListenerStatus('running');
      } else {
        setListenerStatus('error');
      }
    } catch (error) {
      console.error('Error starting event listener:', error);
      setListenerStatus('error');
    }
  };

  const stopEventListener = async () => {
    try {
      const response = await fetch('/api/contract/listen-events', {
        method: 'DELETE',
      });

      if (response.ok) {
        setListenerStatus('stopped');
      }
    } catch (error) {
      console.error('Error stopping event listener:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopped': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HackerRep Self Protocol Integration
          </h1>
          <p className="text-gray-600">
            Monitor and manage your on-chain identity verification system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Contract</CardTitle>
              <CardDescription>HackerRep Self Verification Contract</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Contract Address</label>
                  <div className="mt-1 p-3 bg-gray-100 rounded-md font-mono text-sm">
                    {contractAddress}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Network</label>
                  <div className="mt-1">
                    <Badge variant="outline">Celo Mainnet</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Celoscan</label>
                  <div className="mt-1">
                    <a 
                      href={celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View on Celoscan →
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Listener Status */}
          <Card>
            <CardHeader>
              <CardTitle>Event Listener</CardTitle>
              <CardDescription>Real-time contract event monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(listenerStatus)}`}></div>
                    <span className="capitalize">{listenerStatus}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={startEventListener}
                    disabled={listenerStatus === 'running' || listenerStatus === 'starting'}
                    className="flex-1"
                  >
                    Start Listener
                  </Button>
                  <Button 
                    onClick={stopEventListener}
                    disabled={listenerStatus === 'stopped'}
                    variant="outline"
                    className="flex-1"
                  >
                    Stop Listener
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>System components status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Smart Contract</span>
                  <Badge className="bg-green-100 text-green-800">Deployed</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Frontend Integration</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Endpoints</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Schema</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Migration Required</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => window.open('/api/self/sync-verification', '_blank')}
                >
                  Test Sync API
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('http://localhost:3001', '_blank')}
                >
                  Open Self Workshop
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('/leaderboard', '_blank')}
                >
                  View Leaderboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
            <CardDescription>Complete setup steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium">Run Database Migration</p>
                  <p className="text-sm text-gray-600">Execute HACKERREP_COMPLETE_MIGRATION.sql in Supabase</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium">Start Event Listener</p>
                  <p className="text-sm text-gray-600">Click "Start Listener" above to monitor contract events</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium">Test Verification Flow</p>
                  <p className="text-sm text-gray-600">Open Self Workshop app and scan QR code with Self app</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <p className="font-medium">Verify Integration</p>
                  <p className="text-sm text-gray-600">Check leaderboard for verified users and voting eligibility</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
