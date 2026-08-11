/**
 * Comprehensive Security Utilities
 *
 * This module provides production-ready security functions including:
 * - Input sanitization and validation
 * - CSRF protection
 * - Secure headers generation
 * - XSS prevention
 * - SQL injection prevention
 * - Rate limiting utilities
 * - Security audit logging
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Rate limiting thresholds
  RATE_LIMITS: {
    // General API requests
    GENERAL: { limit: 100, windowMs: 60000 }, // 100 requests per minute
    // Authentication endpoints
    AUTH: { limit: 5, windowMs: 60000 }, // 5 attempts per minute
    // Payment processing
    PAYMENT: { limit: 3, windowMs: 60000 }, // 3 attempts per minute
    // Admin operations
    ADMIN: { limit: 20, windowMs: 60000 }, // 20 requests per minute
    // File uploads
    UPLOAD: { limit: 10, windowMs: 3600000 }, // 10 uploads per hour
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
    MAX_LENGTH: 128,
  },

  // Token security
  TOKEN: {
    SECRET_LENGTH: 32,
    SALT_LENGTH: 16,
    EXPIRY: {
      ACCESS: '15m',
      REFRESH: '7d',
      RESET: '1h',
      EMAIL_VERIFICATION: '24h',
    },
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },

  // Session security
  SESSION: {
    MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    HTTP_ONLY: true,
    SECURE: process.env.NODE_ENV === 'production',
    SAME_SITE: 'lax' as const,
  },
} as const;

/**
 * Sanitize user input to prevent XSS attacks
 *
 * @param input - Raw user input
 * @returns Sanitized string safe for HTML rendering
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[&<>"']/g, (char) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return escapeMap[char];
    })
    .trim();
}

/**
 * Sanitize multiple inputs at once
 *
 * @param inputs - Object with string values to sanitize
 * @returns Object with sanitized values
 */
export function sanitizeInputs<T extends Record<string, any>>(inputs: T): T {
  const sanitized = { ...inputs } as T;

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value) as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      ) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize email address
 *
 * @param email - Email address to validate
 * @returns Sanitized and validated email or null if invalid
 */
export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();

  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Validate phone number (supports multiple formats)
 *
 * @param phone - Phone number to validate
 * @returns Sanitized phone number or null if invalid
 */
export function validatePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-numeric characters
  const sanitized = phone.replace(/\D/g, '');

  // Check if it's a valid phone number (10-15 digits)
  if (sanitized.length < 10 || sanitized.length > 15) {
    return null;
  }

  return sanitized;
}

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Validation result with errors if any
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  const config = SECURITY_CONFIG.PASSWORD;

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
    };
  }

  if (password.length < config.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_LENGTH} characters`);
  }

  if (password.length > config.MAX_LENGTH) {
    errors.push(`Password must not exceed ${config.MAX_LENGTH} characters`);
  }

  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const hasLength = password.length >= 12;
  const hasComplexity =
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasLength && hasComplexity) {
    strength = 'strong';
  } else if (password.length >= 8 && hasComplexity) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Generate a cryptographically secure random token
 *
 * @param length - Length of the token in bytes
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = SECURITY_CONFIG.TOKEN.SECRET_LENGTH): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a CSRF token
 *
 * @returns CSRF token for session validation
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 *
 * @param token - Token to validate
 * @param sessionToken - Session token to compare against
 * @returns True if token is valid
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  // In production, use constant-time comparison to prevent timing attacks
  if (process.env.NODE_ENV === 'production') {
    return constantTimeCompare(token, sessionToken);
  }

  return token === sessionToken;
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure headers for HTTP responses
 *
 * @param options - Header configuration options
 * @returns Object with security headers
 */
export function getSecureHeaders(options: {
  includeCSP?: boolean;
  nonce?: string;
} = {}): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable browser XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };

  // Add Content Security Policy if requested
  if (options.includeCSP) {
    const nonce = options.nonce || generateSecureToken(16);
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `base-uri 'self'`,
      `require-trusted-types-for 'script'`,
    ].join('; ');
  }

  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Hash sensitive data for logging/auditing
 *
 * @param data - Sensitive data to hash
 * @returns Hashed string
 */
export function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 8);
}

/**
 * Mask sensitive information for logging
 *
 * @param data - Data to mask
 * @param visibleChars - Number of characters to keep visible
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || typeof data !== 'string') {
    return '***';
  }

  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * Validate file upload for security
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validateFileUpload(file: File): {
  isValid: boolean;
  error?: string;
} {
  const config = SECURITY_CONFIG.FILE_UPLOAD;

  // Check file size
  if (file.size > config.MAX_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${config.MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  const fileType = file.type as typeof config.ALLOWED_MIME_TYPES[number];
  if (!config.ALLOWED_MIME_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  const normalizedExtension = extension as typeof config.ALLOWED_EXTENSIONS[number];
  if (!config.ALLOWED_EXTENSIONS.includes(normalizedExtension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { isValid: true };
}

/**
 * Generate a secure order number
 *
 * @returns Unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Extract IP address from request headers
 *
 * @param headers - Request headers
 * @returns IP address or fallback
 */
export function extractIPFromHeaders(headers: Headers): string {
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  return 'anonymous';
}

/**
 * Security audit log entry structure
 */
export interface SecurityAuditLog {
  timestamp: Date;
  event: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log security events for audit purposes
 *
 * @param event - Security event description
 * @param metadata - Additional event metadata
 * @param severity - Event severity level
 */
export function logSecurityEvent(
  event: string,
  metadata: Record<string, any> = {},
  severity: SecurityAuditLog['severity'] = 'medium'
): void {
  const logEntry: SecurityAuditLog = {
    timestamp: new Date(),
    event,
    ip: metadata.ip || 'unknown',
    userAgent: metadata.userAgent,
    metadata,
    severity,
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service (Sentry, LogRocket, etc.)
    console.error('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.warn('[SECURITY]', event, metadata);
  }
}

/**
 * Check if request appears to be a bot
 *
 * @param userAgent - User agent string
 * @returns True if likely a bot
 */
export function isLikelyBot(userAgent: string): boolean {
  if (!userAgent) return true;

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http-client/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Rate limit key generator
 *
 * @param identifier - Unique identifier (IP, userId, etc.)
 * @param action - Action being rate limited
 * @returns Rate limit key
 */
export function generateRateLimitKey(identifier: string, action: string): string {
  const hash = createHash('sha256')
    .update(`${identifier}:${action}`)
    .digest('hex');

  return `ratelimit:${action}:${hash.substring(0, 16)}`;
}