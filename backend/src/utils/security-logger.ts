/**
 * Security Event Logger
 * @description Logs security-related events for monitoring and auditing
 */

interface SecurityEvent {
  type: 'AUTH_FAILED' | 'AUTH_SUCCESS' | 'UNAUTHORIZED_ACCESS' | 'PASSWORD_CHANGE' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Giữ tối đa 1000 events trong memory

  /**
   * Log security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(securityEvent);

    // Giữ chỉ maxEvents events gần nhất
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console (trong production nên log vào file hoặc external service)
    this.logToConsole(securityEvent);
  }

  /**
   * Log failed login attempt
   */
  logFailedLogin(email: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'AUTH_FAILED',
      details: { email, reason: 'Invalid credentials' },
      ip,
      userAgent,
    });
  }

  /**
   * Log successful login
   */
  logSuccessfulLogin(userId: string, email: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'AUTH_SUCCESS',
      userId,
      details: { email },
      ip,
      userAgent,
    });
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(userId: string | undefined, path: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'UNAUTHORIZED_ACCESS',
      userId,
      details: { path, reason: 'Missing or invalid token' },
      ip,
      userAgent,
    });
  }

  /**
   * Log password change
   */
  logPasswordChange(userId: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'PASSWORD_CHANGE',
      userId,
      details: { action: 'password_updated' },
      ip,
      userAgent,
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(ip: string, path: string, limit: number): void {
    this.log({
      type: 'RATE_LIMIT_EXCEEDED',
      details: { path, limit },
      ip,
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(userId: string | undefined, activity: string, details?: any, ip?: string, userAgent?: string): void {
    this.log({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      details: { activity, ...details },
      ip,
      userAgent,
    });
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEvent['type'], limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  /**
   * Log to console (trong production nên thay bằng file logging hoặc external service)
   */
  private logToConsole(event: SecurityEvent): void {
    const logLevel = event.type === 'AUTH_SUCCESS' ? 'INFO' : 'WARN';
    const message = `[SECURITY ${logLevel}] ${event.type} - ${event.userId || 'Anonymous'} - ${event.details?.reason || event.details?.activity || ''}`;
    
    if (logLevel === 'WARN') {
      console.warn(message, {
        userId: event.userId,
        ip: event.ip,
        details: event.details,
        timestamp: event.timestamp,
      });
    } else {
      console.log(message, {
        userId: event.userId,
        ip: event.ip,
        timestamp: event.timestamp,
      });
    }
  }
}

export const securityLogger = new SecurityLogger();

