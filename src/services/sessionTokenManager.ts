import { Maps_API_KEY } from '../constants/AppData';
import 'react-native-get-random-values';

function generateUUIDv4(): string {
  const bytes = new Uint8Array(16);
  // @ts-ignore - global crypto is polyfilled by react-native-get-random-values
  (globalThis.crypto || (globalThis as any).msCrypto).getRandomValues(bytes);
  // Per RFC 4122 section 4.4
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}

export interface SessionToken {
  id: string;
  startTime: number;
  lastActivity: number;
  autocompleteRequests: Array<{
    query: string;
    timestamp: number;
    parameters: Record<string, any>;
  }>;
  placeDetailsRequest?: {
    placeId: string;
    timestamp: number;
    parameters: Record<string, any>;
  };
  isCompleted: boolean;
}

export interface BundledRequest {
  sessionToken: string;
  autocompleteRequests: Array<{
    query: string;
    timestamp: number;
    parameters: Record<string, any>;
  }>;
  placeDetailsRequest?: {
    placeId: string;
    timestamp: number;
    parameters: Record<string, any>;
  };
}

class SessionTokenManager {
  private activeSessions: Map<string, SessionToken> = new Map();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute cleanup interval

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
  }

  /**
   * Creates a new session token for a search session
   */
  createSessionToken(): string {
    const sessionId = generateUUIDv4();
    
    const session: SessionToken = {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      autocompleteRequests: [],
      isCompleted: false
    };

    this.activeSessions.set(sessionId, session);
    console.log(`🔑 Created new session token: ${sessionId}`);
    
    return sessionId;
  }

  /**
   * Adds an autocomplete request to a session
   */
  addAutocompleteRequest(sessionId: string, query: string, parameters: Record<string, any>): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found for autocomplete request`);
      return false;
    }

    // Update last activity
    session.lastActivity = Date.now();
    
    // Add the request to the session
    session.autocompleteRequests.push({
      query,
      timestamp: Date.now(),
      parameters
    });

    console.log(`📝 Added autocomplete request to session ${sessionId}: "${query}"`);
    return true;
  }

  /**
   * Completes a session with a place details request
   */
  completeSession(sessionId: string, placeId: string, parameters: Record<string, any>): BundledRequest | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found for completion`);
      return null;
    }

    // Mark session as completed
    session.isCompleted = true;
    session.lastActivity = Date.now();
    
    // Add place details request
    session.placeDetailsRequest = {
      placeId,
      timestamp: Date.now(),
      parameters
    };

    console.log(`✅ Completed session ${sessionId} with place details for: ${placeId}`);

    // Create bundled request for logging/billing
    const bundledRequest: BundledRequest = {
      sessionToken: sessionId,
      autocompleteRequests: [...session.autocompleteRequests],
      placeDetailsRequest: session.placeDetailsRequest
    };

    // Remove completed session from active sessions
    this.activeSessions.delete(sessionId);

    return bundledRequest;
  }

  /**
   * Gets session information
   */
  getSession(sessionId: string): SessionToken | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Checks if a session is still valid
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const timeSinceLastActivity = Date.now() - session.lastActivity;
    return timeSinceLastActivity < this.SESSION_TIMEOUT;
  }

  /**
   * Gets all active sessions
   */
  getActiveSessions(): SessionToken[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cleans up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeSinceLastActivity = now - session.lastActivity;
      if (timeSinceLastActivity >= this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }

    // Remove expired sessions
    for (const sessionId of expiredSessions) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        console.log(`⏰ Session ${sessionId} expired after ${Math.round((now - session.startTime) / 1000)}s`);
        
        // Log expired session for billing purposes (only autocomplete requests charged)
        this.logExpiredSession(session);
      }
      this.activeSessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Logs an expired session for billing purposes
   */
  private logExpiredSession(session: SessionToken): void {
    console.log(`📊 Expired session ${session.id} summary:`, {
      duration: `${Math.round((Date.now() - session.startTime) / 1000)}s`,
      autocompleteRequests: session.autocompleteRequests.length,
      totalCost: this.calculateSessionCost(session, false) // false = expired session
    });
  }

  /**
   * Calculates the estimated cost for a session
   */
  calculateSessionCost(session: SessionToken, isCompleted: boolean): number {
    let totalCost = 0;
    
    // Google Places API pricing (as of 2024)
    const pricing = {
      autocomplete: 0.00283, // $0.00283 per request
      details: 0.017, // $0.017 per request
    };

    if (isCompleted) {
      // Completed session: bundle autocomplete requests + place details
      // Only charge for place details, autocomplete is bundled
      totalCost = pricing.details;
    } else {
      // Expired session: charge for each autocomplete request individually
      totalCost = session.autocompleteRequests.length * pricing.autocomplete;
    }

    return totalCost;
  }

  /**
   * Gets session statistics
   */
  getSessionStats(): {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
  } {
    const activeSessions = this.activeSessions.size;
    const now = Date.now();
    
    // Calculate average session duration for completed sessions
    let totalDuration = 0;
    let sessionCount = 0;
    
    for (const session of this.activeSessions.values()) {
      const duration = now - session.startTime;
      totalDuration += duration;
      sessionCount++;
    }

    const averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;

    return {
      activeSessions,
      totalSessions: sessionCount,
      averageSessionDuration
    };
  }
}

export const sessionTokenManager = new SessionTokenManager(); 