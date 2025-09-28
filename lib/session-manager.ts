// Session Manager for Concurrent Self Protocol Verifications
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client conditionally
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export interface VerificationSession {
  id: string;
  sessionId: string;
  walletAddress: string;
  status: 'pending' | 'qr_generated' | 'user_scanned' | 'verifying' | 'verified' | 'failed' | 'expired' | 'cancelled';
  selfAppConfig: any;
  qrCodeData?: string;
  universalLink?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private activeSessions: Map<string, VerificationSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new verification session
   */
  async createSession(walletAddress: string, selfAppConfig: any): Promise<VerificationSession> {
    const supabase = getSupabaseClient();
    const sessionId = `hackerrep_${walletAddress}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const session: VerificationSession = {
      id: sessionId,
      sessionId,
      walletAddress: walletAddress.toLowerCase(),
      status: 'pending',
      selfAppConfig,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    const { data, error } = await supabase
      .from('verification_sessions')
      .insert({
        session_id: sessionId,
        wallet_address: walletAddress.toLowerCase(),
        status: 'pending',
        self_app_config: selfAppConfig,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    // Store in memory
    this.activeSessions.set(sessionId, session);

    // Log session creation
    await this.logSessionEvent(sessionId, 'session_created', { walletAddress });

    return session;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: VerificationSession['status'], additionalData?: any): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update memory
    session.status = status;
    session.updatedAt = new Date();

    // Update database
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (additionalData) {
      if (additionalData.qrCodeData) {
        updateData.qr_code_data = additionalData.qrCodeData;
        session.qrCodeData = additionalData.qrCodeData;
      }
      if (additionalData.universalLink) {
        updateData.universal_link = additionalData.universalLink;
        session.universalLink = additionalData.universalLink;
      }
      if (additionalData.verificationData) {
        updateData.verification_data = additionalData.verificationData;
      }
      if (additionalData.txHash) {
        updateData.contract_tx_hash = additionalData.txHash;
      }
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('verification_sessions')
      .update(updateData)
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }

    // Log status change
    await this.logSessionEvent(sessionId, 'status_changed', { 
      oldStatus: session.status, 
      newStatus: status,
      ...additionalData 
    });
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<VerificationSession | null> {
    // Check memory first
    const memorySession = this.activeSessions.get(sessionId);
    if (memorySession) {
      return memorySession;
    }

    // Check database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convert to session object
    const session: VerificationSession = {
      id: data.session_id,
      sessionId: data.session_id,
      walletAddress: data.wallet_address,
      status: data.status,
      selfAppConfig: data.self_app_config,
      qrCodeData: data.qr_code_data,
      universalLink: data.universal_link,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    // Store in memory
    this.activeSessions.set(sessionId, session);

    return session;
  }

  /**
   * Get active sessions for a wallet
   */
  async getActiveSessionsForWallet(walletAddress: string): Promise<VerificationSession[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .in('status', ['pending', 'qr_generated', 'user_scanned', 'verifying'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }

    return data.map(session => ({
      id: session.session_id,
      sessionId: session.session_id,
      walletAddress: session.wallet_address,
      status: session.status,
      selfAppConfig: session.self_app_config,
      qrCodeData: session.qr_code_data,
      universalLink: session.universal_link,
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at)
    }));
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId: string): Promise<void> {
    await this.updateSessionStatus(sessionId, 'cancelled');
    this.activeSessions.delete(sessionId);
  }

  /**
   * Log session event
   */
  private async logSessionEvent(sessionId: string, eventType: string, eventData?: any): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('session_events')
        .insert({
          session_id: sessionId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log session event:', error);
    }
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    
    // Clean memory
    for (const [sessionId, session] of this.activeSessions) {
      if (session.expiresAt < now) {
        await this.updateSessionStatus(sessionId, 'expired');
        this.activeSessions.delete(sessionId);
      }
    }

    // Clean database
    const supabase = getSupabaseClient();
    await supabase
      .from('verification_sessions')
      .update({ status: 'expired' })
      .lt('expires_at', now.toISOString())
      .in('status', ['pending', 'qr_generated', 'user_scanned', 'verifying']);
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    expired: number;
  }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('verification_sessions')
      .select('status');

    if (error) {
      throw new Error(`Failed to get session stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      active: data.filter(s => ['pending', 'qr_generated', 'user_scanned', 'verifying'].includes(s.status)).length,
      completed: data.filter(s => s.status === 'verified').length,
      expired: data.filter(s => s.status === 'expired').length
    };

    return stats;
  }

  /**
   * Stop cleanup interval
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();