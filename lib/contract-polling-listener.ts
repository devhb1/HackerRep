// Polling-based Contract Event Listener for HackerRep Self Verification
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

const CONTRACT_ADDRESS = '0xF54C11EbC39905dd88496E098CDEeC565F79a696'; // VERIFIED CONTRACT ON CELOSCAN
const CELO_RPC_URL = 'https://forno.celo.org';

// Contract ABI for HackerRepSelfVerification events
const CONTRACT_ABI = [
  "event UserVerified(address indexed user, string nationality, string gender, uint256 age, uint256 timestamp)",
  "event VerificationRevoked(address indexed user, uint256 timestamp)",
  "event DemographicDataExtracted(address indexed user, string nationality, string gender, uint256 age)"
];

export class ContractPollingListener {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private supabase: any;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async startPolling() {
    if (this.isRunning) {
      console.log('🔄 Polling listener already running');
      return;
    }

    console.log('🔍 Starting contract polling listener for HackerRep...');
    console.log('📋 Contract Address:', CONTRACT_ADDRESS);
    console.log('🌐 Network: Celo Mainnet');

    try {
      // Get current block number
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      console.log('📊 Starting from block:', this.lastProcessedBlock);

      this.isRunning = true;
      
      // Start polling every 30 seconds
      this.pollingInterval = setInterval(async () => {
        await this.pollForEvents();
      }, 30000);

      console.log('🎧 Contract polling listener started successfully!');
    } catch (error) {
      console.error('Failed to start polling listener:', error);
      throw error;
    }
  }

  private async pollForEvents() {
    if (!this.isRunning) return;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock <= this.lastProcessedBlock) {
        return; // No new blocks
      }

      console.log(`🔍 Polling blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);

      // Get UserVerified events
      const userVerifiedFilter = this.contract.filters.UserVerified();
      const userVerifiedEvents = await this.contract.queryFilter(
        userVerifiedFilter,
        this.lastProcessedBlock + 1,
        currentBlock
      );

      // Get VerificationRevoked events
      const verificationRevokedFilter = this.contract.filters.VerificationRevoked();
      const verificationRevokedEvents = await this.contract.queryFilter(
        verificationRevokedFilter,
        this.lastProcessedBlock + 1,
        currentBlock
      );

      // Process UserVerified events
      for (const event of userVerifiedEvents) {
        try {
          const [user, nationality, gender, age, timestamp] = event.args as any;
          console.log('✅ UserVerified event found:', {
            user,
            nationality,
            gender,
            age,
            timestamp: new Date(Number(timestamp) * 1000),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });

          await this.handleUserVerified(user, nationality, gender, age, timestamp, event.transactionHash);
        } catch (error) {
          console.error('Error processing UserVerified event:', error);
        }
      }

      // Process VerificationRevoked events
      for (const event of verificationRevokedEvents) {
        try {
          const [user, timestamp] = event.args as any;
          console.log('❌ VerificationRevoked event found:', {
            user,
            timestamp: new Date(Number(timestamp) * 1000),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });

          await this.handleVerificationRevoked(user, timestamp, event.transactionHash);
        } catch (error) {
          console.error('Error processing VerificationRevoked event:', error);
        }
      }

      // Update last processed block
      this.lastProcessedBlock = currentBlock;

      if (userVerifiedEvents.length > 0 || verificationRevokedEvents.length > 0) {
        console.log(`📊 Processed ${userVerifiedEvents.length} UserVerified and ${verificationRevokedEvents.length} VerificationRevoked events`);
      }

    } catch (error) {
      console.error('Error polling for events:', error);
    }
  }

  private async handleUserVerified(
    userAddress: string,
    nationality: string,
    gender: string,
    age: number,
    timestamp: bigint,
    txHash: string
  ) {
    try {
      console.log('🔄 Processing UserVerified event for:', userAddress);
      
      // Check if user exists in database
      const { data: existingUser, error: fetchError } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', userAddress.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        return;
      }

      // Update or create user with ONLY the 3 Self verification fields
      if (existingUser) {
        // Update existing user with Self verification fields
        const { error: updateError } = await this.supabase
          .from('users')
          .update({
            nationality: nationality,
            gender: gender,
            age: Number(age),
            self_verified: true,
            verification_level: 2,
            voting_eligible: nationality === 'INDIA',
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', userAddress.toLowerCase());

        if (updateError) {
          console.error('Error updating user:', updateError);
          return;
        }

        console.log('✅ Updated existing user with Self verification data');
      } else {
        // Create new user with Self verification fields
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            wallet_address: userAddress.toLowerCase(),
            display_name: `User ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`,
            nationality: nationality,
            gender: gender,
            age: Number(age),
            self_verified: true,
            verification_level: 2,
            voting_eligible: nationality === 'INDIA',
            reputation_score: 100, // Base reputation
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user:', insertError);
          return;
        }

        console.log('✅ Created new user with Self verification data');
      }

      // Store verification record
      const { error: verificationError } = await this.supabase
        .from('self_verifications')
        .insert({
          wallet_address: userAddress.toLowerCase(),
          nationality: nationality,
          gender: gender,
          age: Number(age),
          identity_commitment: `self_${userAddress}_${Date.now()}`,
          verification_status: 'verified',
          verified_at: new Date(Number(timestamp) * 1000).toISOString(),
          tx_hash: txHash,
          block_number: 0,
          created_at: new Date().toISOString()
        });

      if (verificationError) {
        console.error('Error storing verification record:', verificationError);
      }

      // Update any active verification sessions for this wallet
      const { data: activeSessions, error: sessionError } = await this.supabase
        .from('verification_sessions')
        .select('*')
        .eq('wallet_address', userAddress.toLowerCase())
        .in('status', ['pending', 'qr_generated', 'user_scanned', 'verifying'])
        .gt('expires_at', new Date().toISOString());

      if (!sessionError && activeSessions) {
        for (const session of activeSessions) {
          await this.supabase
            .from('verification_sessions')
            .update({
              status: 'verified',
              verification_data: {
                nationality,
                gender,
                age: Number(age),
                txHash,
                timestamp: Number(timestamp)
              },
              contract_tx_hash: txHash,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('session_id', session.session_id);
        }
        console.log(`✅ Updated ${activeSessions.length} verification sessions`);
      }

      // Create activity entry
      if (existingUser) {
        await this.supabase
          .from('activities')
          .insert({
            user_id: existingUser.id,
            activity_type: 'self_verification',
            description: `Identity verified with Self Protocol - Nationality: ${nationality}, Gender: ${gender}, Age: ${age}`
          });
      }

      console.log('🎉 User verification synced to database successfully!');
      console.log('📊 Verification details:', { nationality, gender, age, txHash });

    } catch (error) {
      console.error('Error handling UserVerified event:', error);
    }
  }

  private async handleVerificationRevoked(
    userAddress: string,
    timestamp: bigint,
    txHash: string
  ) {
    try {
      console.log('🔄 Processing VerificationRevoked event for:', userAddress);
      
      // Update user verification status
      const { error: updateError } = await this.supabase
        .from('users')
        .update({
          self_verified: false,
          verification_level: 0,
          voting_eligible: false,
          nationality: null,
          gender: null,
          age: null,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', userAddress.toLowerCase());

      if (updateError) {
        console.error('Error revoking user verification:', updateError);
        return;
      }

      // Update verification record
      const { error: verificationError } = await this.supabase
        .from('self_verifications')
        .update({
          verification_status: 'revoked',
          revoked_at: new Date(Number(timestamp) * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', userAddress.toLowerCase());

      if (verificationError) {
        console.error('Error updating verification record:', verificationError);
      }

      console.log('❌ User verification revoked successfully');

    } catch (error) {
      console.error('Error handling VerificationRevoked event:', error);
    }
  }

  async stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Contract polling listener stopped');
  }

  isListenerRunning(): boolean {
    return this.isRunning;
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}

// Export singleton instance
export const contractPollingListener = new ContractPollingListener();
